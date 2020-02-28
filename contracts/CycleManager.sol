pragma solidity ^0.4.24;

import "@aragon/os/contracts/apps/AragonApp.sol";
import "@aragon/os/contracts/lib/math/SafeMath.sol";
import "./ICycleManager.sol";

contract CycleManager is AragonApp, ICycleManager {
    using SafeMath for uint256;

    bytes32 constant public UPDATE_CYCLE_ROLE = keccak256("UPDATE_CYCLE_ROLE");
    bytes32 constant public START_CYCLE_ROLE = keccak256("START_CYCLE_ROLE");

    string private constant ERROR_CYCLE_LENGTH = "CYCLE_MANAGER_CYCLE_LENGTH";
    string private constant ERROR_CYCLE_NOT_ENDED = "CYCLE_MANAGER_CYCLE_NOT_ENDED";

    uint256 public cycleLength;
    uint256 public pendingCycleLength;
    uint256 public currentCycle;
    uint256 public currentCycleStartTime;

    event UpdateCycleLength(uint256 newCycleLength);
    event StartNextCycle(uint256 cycleId);

    function initialize(uint256 _cycleLength) public onlyInit {
        require(_cycleLength > 0, ERROR_CYCLE_LENGTH);

        cycleLength = _cycleLength;
        pendingCycleLength = _cycleLength;
        currentCycle = 0;
        currentCycleStartTime = getTimestamp();

        initialized();
    }

    /**
     * @notice Set the cycle length to `_newCycleLength` seconds
     * @param _newCycleLength The new cycle length in seconds
     */
    function updateCycleLength(uint256 _newCycleLength) external auth(UPDATE_CYCLE_ROLE) {
        require(_newCycleLength > 0, ERROR_CYCLE_LENGTH);

        pendingCycleLength = _newCycleLength;
        emit UpdateCycleLength(_newCycleLength);
    }

    /**
     * @notice Start the next cycle
     */
    function startNextCycle() external auth(START_CYCLE_ROLE) {
        require(getTimestamp() >= currentCycleEndTime(), ERROR_CYCLE_NOT_ENDED);

        currentCycle++;
        currentCycleStartTime = getTimestamp();

        if (cycleLength != pendingCycleLength) {
           cycleLength = pendingCycleLength;
        }

        emit StartNextCycle(currentCycle);
    }

    function currentCycleEndTime() public view returns (uint256) {
        return currentCycleStartTime.add(cycleLength);
    }
}
