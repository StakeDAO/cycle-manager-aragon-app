import 'core-js/stable'
import 'regenerator-runtime/runtime'
import Aragon, { events } from '@aragon/api'

const app = new Aragon()

app.store(
  async (state, { event }) => {
    const nextState = {
      ...state,
    }

    try {
      switch (event) {
        case 'UpdateCycleLength':
          return { ...nextState, pendingCycleLength: await getPendingCycleLength() }
        case 'StartNextCycle':
          return { ...nextState,
            cycleLength: await getCycleLength(),
            currentCycle: await getCurrentCycle(),
            currentCycleStartTime: await getCurrentCycleStartTime(),
            currentCycleEndTime: await getCurrentCycleEndTime()
          }
        case events.SYNC_STATUS_SYNCING:
          return { ...nextState, isSyncing: true }
        case events.SYNC_STATUS_SYNCED:
          return { ...nextState, isSyncing: false }
        default:
          return state
      }
    } catch (err) {
      console.log(err)
    }
  },
  {
    init: initializeState(),
  }
)

/***********************
 *                     *
 *   Event Handlers    *
 *                     *
 ***********************/

function initializeState() {
  return async cachedState => {
    return {
      ...cachedState,
      cycleLength: await getCycleLength(),
      pendingCycleLength: await getPendingCycleLength(),
      currentCycle: await getCurrentCycle(),
      currentCycleStartTime: await getCurrentCycleStartTime(),
      currentCycleEndTime: await getCurrentCycleEndTime()
    }
  }
}

async function getCycleLength() {
  return parseInt(await app.call('cycleLength').toPromise(), 10)
}

async function getPendingCycleLength() {
  return parseInt(await app.call('pendingCycleLength').toPromise(), 10)
}

async function getCurrentCycle() {
  return parseInt(await app.call('currentCycle').toPromise(), 10)
}

async function getCurrentCycleStartTime() {
  return parseInt(await app.call('currentCycleStartTime').toPromise(), 10)
}

async function getCurrentCycleEndTime() {
  console.log("End Time DO: ")
  return parseInt(await app.call('currentCycleEndTime').toPromise(), 10)
}
