const { assertRevert } = require('./helpers/assertThrow')
const { hash } = require('eth-ens-namehash')
const deployDAO = require('./helpers/deployDAO')

const CycleManager = artifacts.require('CycleManagerMock.sol')

const ANY_ADDRESS = '0xffffffffffffffffffffffffffffffffffffffff'

const getLog = (receipt, logName, argName) => {
  const log = receipt.logs.find(({ event }) => event === logName)
  return log ? log.args[argName] : null
}

const deployedContract = receipt => getLog(receipt, 'NewAppProxy', 'proxy')

contract('CycleManager', ([appManager, user]) => {

  let UPDATE_CYCLE_ROLE, START_CYCLE_ROLE
  let cycleManagerBase, cycleManager
  const CYCLE_LENGTH_SECONDS = 100
  let initTime

  before('deploy base app', async () => {
    cycleManagerBase = await CycleManager.new()
    UPDATE_CYCLE_ROLE = await cycleManagerBase.UPDATE_CYCLE_ROLE()
    START_CYCLE_ROLE = await cycleManagerBase.START_CYCLE_ROLE()
  })

  beforeEach('deploy dao and app', async () => {
    const { dao, acl } = await deployDAO(appManager)

    const newAppInstanceReceipt = await dao.newAppInstance(
      hash('cycle-manager.aragonpm.test'), cycleManagerBase.address, '0x', false, { from: appManager })
    cycleManager = await CycleManager.at(deployedContract(newAppInstanceReceipt))

    await acl.createPermission(ANY_ADDRESS, cycleManager.address, UPDATE_CYCLE_ROLE, appManager, { from: appManager })
    await acl.createPermission(ANY_ADDRESS, cycleManager.address, START_CYCLE_ROLE, appManager, { from: appManager })

    initTime = await cycleManager.getTimestampPublic()
    await cycleManager.initialize(CYCLE_LENGTH_SECONDS)
  })

  describe('initialize(uint256 _cycleLength)', () => {
    it('should set correct initial config', async () => {
      assert.equal(await cycleManager.cycleLength(), CYCLE_LENGTH_SECONDS)
      assert.equal(await cycleManager.currentCycle(), 0)
      assert.closeTo((await cycleManager.currentCycleStartTime()).toNumber(), initTime.toNumber(), 3)
    })
  })

  describe('startNextCycle()', () => {
    it('should return correct cycle after init', async () => {
      assert.equal(await cycleManager.currentCycle(), 0)
    })

    it('should return correct cycle after next cycle has started', async () => {
      await cycleManager.mockIncreaseTime(CYCLE_LENGTH_SECONDS)
      await cycleManager.startNextCycle()
      assert.equal(await cycleManager.currentCycle(), 1)
    })

    it('should return correct cycle after much time has passed', async () => {
      await cycleManager.mockIncreaseTime(CYCLE_LENGTH_SECONDS * 4)
      await cycleManager.startNextCycle()
      assert.equal(await cycleManager.currentCycle(), 1)
    })

    it('should return correct cycle after multiple cycles have passed', async () => {
      await cycleManager.mockIncreaseTime(CYCLE_LENGTH_SECONDS)
      await cycleManager.startNextCycle()

      await cycleManager.mockIncreaseTime(CYCLE_LENGTH_SECONDS)
      await cycleManager.startNextCycle()

      await cycleManager.mockIncreaseTime(CYCLE_LENGTH_SECONDS)
      await cycleManager.startNextCycle()

      assert.equal(await cycleManager.currentCycle(), 3)
    })

    it('should revert before cycle has ended', async () => {
      await cycleManager.mockIncreaseTime(CYCLE_LENGTH_SECONDS - 3)
      assert.equal(await cycleManager.currentCycle(), 0)
      await assertRevert(cycleManager.startNextCycle(), 'CYCLE_MANAGER_CYCLE_NOT_ENDED')
    })
  })

  describe('currentCycleEnd()', () => {
    it('should return correct cycle end after init', async () => {
      const currentTime = await cycleManager.getTimestampPublic()
      const cycleEndTime = await cycleManager.currentCycleEnd()
      assert.equal(cycleEndTime.toString(), currentTime.toNumber() + CYCLE_LENGTH_SECONDS)
    })

    it('should return correct cycle end after next cycle has started', async () => {
      const currentTime = await cycleManager.getTimestampPublic()
      const expectedCycleEnd = currentTime.toNumber() + (CYCLE_LENGTH_SECONDS * 2)
      await cycleManager.mockIncreaseTime(CYCLE_LENGTH_SECONDS)
      await cycleManager.startNextCycle()

      const cycleEndTime = await cycleManager.currentCycleEnd()
      assert.equal(cycleEndTime.toString(), expectedCycleEnd)
    })
  })

  describe('updateCycleLength(uint256 _newCycleLength)', () => {

    const NEW_CYCLE_LENGTH = 10;
    let updateTime

    beforeEach(async () => {
      updateTime = await cycleManager.currentCycleEnd()
      await cycleManager.updateCycleLength(NEW_CYCLE_LENGTH)
    })

    it('should set pending cycle length', async () => {
      assert.equal(await cycleManager.pendingCycleLength(), NEW_CYCLE_LENGTH)
      assert.equal(await cycleManager.cycleLength(), CYCLE_LENGTH_SECONDS)
    })

    describe('startNextCycle()', () => {
      it('should revert before cycle has ended', async () => {
        await cycleManager.mockIncreaseTime(CYCLE_LENGTH_SECONDS - 3)
        assert.equal(await cycleManager.currentCycle(), 0)
        await assertRevert(cycleManager.startNextCycle(), 'CYCLE_MANAGER_CYCLE_NOT_ENDED')
      })

      it('should update the cycle length and set new cycle', async () => {
        await cycleManager.mockIncreaseTime(CYCLE_LENGTH_SECONDS)
        await cycleManager.startNextCycle()

        assert.equal(await cycleManager.cycleLength(), 10)
        assert.equal(await cycleManager.currentCycle(), 1)
      })

      it('should return new cycle once first new cycle length cycle has ended', async () => {
        await cycleManager.mockIncreaseTime(CYCLE_LENGTH_SECONDS)
        await cycleManager.startNextCycle()

        await cycleManager.mockIncreaseTime(NEW_CYCLE_LENGTH)
        await cycleManager.startNextCycle()

        assert.equal(await cycleManager.currentCycle(), 2)
      })
    })
  })
})
