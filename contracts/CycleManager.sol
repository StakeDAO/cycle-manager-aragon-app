pragma solidity ^0.4.24;

import "@aragon/os/contracts/apps/AragonApp.sol";
import "@aragon/os/contracts/lib/math/SafeMath.sol";

// TODO: Use SafeMath, maybe not necessary
contract CycleManager is AragonApp {
    using SafeMath for uint256;

    bytes32 constant public UPDATE_CYCLE_ROLE = keccak256("UPDATE_CYCLE_ROLE");
    bytes32 constant public START_CYCLE_ROLE = keccak256("START_CYCLE_ROLE");

    string private constant ERROR_CYCLE_NOT_ENDED = "CYCLE_MANAGER_CYCLE_NOT_ENDED";

    uint256 public cycleLength;
    uint256 public pendingCycleLength;
    uint256 public currentCycle;
    uint256 public currentCycleStartTime;

    event ChangeCycleLength(uint256 newCycleLength);
    event NewCycle(uint256 cycleId);

    function initialize(uint256 _cycleLength) public onlyInit {
        cycleLength = _cycleLength;
        pendingCycleLength = _cycleLength;
        currentCycle = 0;
        currentCycleStartTime = getTimestamp();
        initialized();
    }

    /**
     * @notice Set the cycle length in seconds
     * @param _newCycleLength The new cycle length in seconds
     */
    function updateCycleLength(uint256 _newCycleLength) external auth(UPDATE_CYCLE_ROLE) {
        pendingCycleLength = _newCycleLength;
        emit ChangeCycleLength(_newCycleLength);
    }

    function startNextCycle() external auth(START_CYCLE_ROLE) {
        require(getTimestamp() >= currentCycleEnd(), ERROR_CYCLE_NOT_ENDED);

        currentCycle++;
        currentCycleStartTime = getTimestamp();

        if (cycleLength != pendingCycleLength) {
           cycleLength = pendingCycleLength;
        }

        emit NewCycle(currentCycle);
    }

    function currentCycleEnd() public view returns (uint256) {
        return currentCycleStartTime + cycleLength;
    }
}
