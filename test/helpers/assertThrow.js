const THROW_ERROR_PREFIX = 'VM Exception while processing transaction: revert'

async function assertThrows(blockOrPromise, expectedErrorCode, expectedReason) {
  try {
    (typeof blockOrPromise === 'function') ? await blockOrPromise() : await blockOrPromise
  } catch (error) {
    assert(error.message.search(expectedErrorCode) > -1, `Expected error code "${expectedErrorCode}" but failed with "${error}" instead.`)
    return error
  }
  // assert.fail() for some reason does not have its error string printed 🤷
  assert(false, `Expected "${expectedErrorCode}"${expectedReason ? ` (with reason: "${expectedReason}")` : ''} but it did not fail`)
}

module.exports = {
  async assertRevert(blockOrPromise, expectedReason) {
    const error = await assertThrows(blockOrPromise, 'revert', expectedReason)
    if (error.message.includes(THROW_ERROR_PREFIX)) {
      error.reason = error.message.replace(THROW_ERROR_PREFIX, '').trim()
    }

    if (process.env.SOLIDITY_COVERAGE !== 'true' && expectedReason) {
      assert.include(
        error.reason,
        expectedReason,
        `Expected revert reason "${expectedReason}" but failed with "${error.reason || 'no reason'}" instead.`
      )
    }
  },
}