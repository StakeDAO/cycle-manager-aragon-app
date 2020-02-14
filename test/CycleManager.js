const { assertRevert } = require('@aragon/test-helpers/assertThrow')
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

  let UPDATE_CYCLE_ROLE
  let cycleManagerBase, cycleManager
  const CYCLE_LENGTH_SECONDS = 100
  let initTime

  before('deploy base app', async () => {
    cycleManagerBase = await CycleManager.new()
    UPDATE_CYCLE_ROLE = await cycleManagerBase.UPDATE_CYCLE_ROLE()
  })

  beforeEach('deploy dao and app', async () => {
    const { dao, acl } = await deployDAO(appManager)

    const newAppInstanceReceipt = await dao.newAppInstance(
      hash('cycle-manager.aragonpm.test'), cycleManagerBase.address, '0x', false, { from: appManager })
    cycleManager = await CycleManager.at(deployedContract(newAppInstanceReceipt))

    await acl.createPermission(ANY_ADDRESS, cycleManager.address, UPDATE_CYCLE_ROLE, appManager, { from: appManager })

    initTime = await cycleManager.getTimestampPublic()
    await cycleManager.initialize(CYCLE_LENGTH_SECONDS)
  })

  describe('initialize(uint256 _cycleLength)', () => {
    it('should set correct initial config', async () => {
      assert.equal(await cycleManager.cycleLength(), CYCLE_LENGTH_SECONDS)
      assert.equal(await cycleManager.cycleLengthUpdateCycle(), 0)
      assert.closeTo((await cycleManager.cycleLengthUpdateStartTime()).toNumber(), initTime.toNumber(), 3)
    })
  })

  describe('currentCycle()', () => {
    it('should return correct cycle after init', async () => {
      assert.equal(await cycleManager.currentCycle(), 0)
    })

    it('should return correct cycle before cycle has ended', async () => {
      await cycleManager.mockIncreaseTime(CYCLE_LENGTH_SECONDS - 1)
      assert.equal(await cycleManager.currentCycle(), 0)
    })

    it('should return correct cycle after time has passed', async () => {
      await cycleManager.mockIncreaseTime(CYCLE_LENGTH_SECONDS)
      assert.equal(await cycleManager.currentCycle(), 1)
    })

    it('should return correct cycle after lots of time has passed', async () => {
      await cycleManager.mockIncreaseTime(CYCLE_LENGTH_SECONDS * 4)
      assert.equal(await cycleManager.currentCycle(), 4)
    })
  })

  describe('currentCycleEnd()', () => {
    it('should return correct cycle end after init', async () => {
      const currentTime = await cycleManager.getTimestampPublic()
      const cycleEndTime = await cycleManager.currentCycleEnd()
      assert.equal(cycleEndTime.toString(), currentTime.toNumber() + CYCLE_LENGTH_SECONDS)
    })

    it('should return correct cycle end after time has passed', async () => {
      const currentTime = await cycleManager.getTimestampPublic()
      const expectedCycleEnd = currentTime.toNumber() + (CYCLE_LENGTH_SECONDS * 2)

      await cycleManager.mockIncreaseTime(CYCLE_LENGTH_SECONDS)
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

    it('should set correct config', async () => {
      assert.equal(await cycleManager.cycleLength(), NEW_CYCLE_LENGTH)
      assert.equal(await cycleManager.cycleLengthUpdateCycle(), 1)
      assert.closeTo((await cycleManager.cycleLengthUpdateStartTime()).toNumber(), updateTime.toNumber(), 3)
    })

    describe('currentCycle()', () => {
      it('should return original cycle before it has ended', async () => {
        await cycleManager.mockIncreaseTime(CYCLE_LENGTH_SECONDS - 1)
        assert.equal(await cycleManager.currentCycle(), 0)
      })

      it('should return new cycle once previous cycle has ended', async () => {
        await cycleManager.mockIncreaseTime(CYCLE_LENGTH_SECONDS + 1)
        assert.equal(await cycleManager.currentCycle(), 1)
      })

      it('should return new cycle once first new cycle length cycle has ended', async () => {
        await cycleManager.mockIncreaseTime(CYCLE_LENGTH_SECONDS + NEW_CYCLE_LENGTH)
        assert.equal(await cycleManager.currentCycle(), 2)
      })
    })
  })
})
