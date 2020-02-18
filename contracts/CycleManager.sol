pragma solidity ^0.4.24;

import "@aragon/os/contracts/apps/AragonApp.sol";
import "@aragon/os/contracts/lib/math/SafeMath.sol";

// TODO: Use SafeMath, maybe not necessary
contract CycleManager is AragonApp {
    using SafeMath for uint256;

    bytes32 constant public UPDATE_CYCLE_ROLE = keccak256("UPDATE_CYCLE_ROLE");

    event ChangeCycleLength(uint256 newCycleLength);

    uint256 public cycleLength;
    uint256 public cycleLengthUpdateCycle;
    uint256 public cycleLengthUpdateStartTime;

    function initialize(uint256 _cycleLength) public onlyInit {
        cycleLength = _cycleLength;
        cycleLengthUpdateCycle = 0;
        cycleLengthUpdateStartTime = getTimestamp();
        initialized();
    }

    /**
     * @notice Set the cycle length in seconds
     * @param _newCycleLength The new cycle length
     */
    function updateCycleLength(uint256 _newCycleLength) external auth(UPDATE_CYCLE_ROLE) {
        cycleLengthUpdateCycle = currentCycle() + 1;
        cycleLengthUpdateStartTime = currentCycleEnd();
        cycleLength = _newCycleLength;

        emit ChangeCycleLength(_newCycleLength);
    }

    function currentCycle() public view returns (uint256) {
        if (getTimestamp() < cycleLengthUpdateStartTime) {
            return cycleLengthUpdateCycle - 1;
        }

        uint256 timeSinceCycleLengthUpdate = getTimestamp() - cycleLengthUpdateStartTime;
        return timeSinceCycleLengthUpdate / cycleLength + cycleLengthUpdateCycle;
    }

    function currentCycleEnd() public view returns (uint256) {
        uint256 cyclesUsingCurrentCycleLength = currentCycle() + 1 - cycleLengthUpdateCycle;
        return cyclesUsingCurrentCycleLength * cycleLength + cycleLengthUpdateStartTime;
    }
}
