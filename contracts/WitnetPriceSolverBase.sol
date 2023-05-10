// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0 <0.9.0;

import "witnet-solidity-bridge/contracts/data/WitnetPriceFeedsData.sol";
import "witnet-solidity-bridge/contracts/interfaces/V2/IWitnetPriceFeeds.sol";

abstract contract WitnetPriceSolverBase
    is
        IWitnetPriceSolver,
        WitnetPriceFeedsData
{
    address public immutable override delegator;

    modifier onlyDelegator {
        require(
            address(this) == delegator,
            "WitnetPriceSolverBase: not the delegator"
        );
        _;
    }

    constructor(address _delegator) {
        assert(address(_delegator) != address(0));
        delegator = _delegator;
    }

    function class() external pure returns (bytes4) {
        return type(IWitnetPriceSolver).interfaceId;
    }

    function validate(bytes4 feedId, string[] calldata deps) virtual override external {
        bytes32 _depsFlag;
        uint256 _innerDecimals;
        require(
            deps.length <= 8,
            "WitnetPriceSolverBase: too many deps"
        );
        for (uint _ix = 0; _ix < deps.length; _ix ++) {
            bytes4 _depsId4 = bytes4(keccak256(bytes(deps[_ix])));
            Record storage __depsFeed = __records_(_depsId4);
            require(
                __depsFeed.index > 0, 
                string(abi.encodePacked(
                    "WitnetPriceSolverBase: unsupported: ",
                    deps[_ix]
                ))
            );
            require(
                _depsId4 != feedId, 
                string(abi.encodePacked(
                    "WitnetPriceSolverBase: first-level loop: ",
                    deps[_ix]
                ))
            );
            _depsFlag |= (bytes32(_depsId4) >> (32 * _ix));
            _innerDecimals += __depsFeed.decimals;
        }
        Record storage __feed = __records_(feedId);
        __feed.solverReductor = int(uint(__feed.decimals)) - int(_innerDecimals);
        __feed.solverDepsFlag = _depsFlag;
    }
}