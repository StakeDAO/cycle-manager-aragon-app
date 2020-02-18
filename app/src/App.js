import React, { useState } from 'react'
import { useAragonApi } from '@aragon/api-react'
import {
  Box,
  Button,
  GU,
  Header,
  Main,
  SyncIndicator,
  Text, TextInput,
  textStyle,
} from '@aragon/ui'
import styled from 'styled-components'

function App() {
  const { api, appState } = useAragonApi()
  const { cycleLength, pendingCycleLength, currentCycle, currentCycleStartTime, isSyncing } = appState

  const [newCycleLength, setNewCycleLength] = useState(0)

  return (
    <Main>
      {isSyncing && <SyncIndicator />}
      <Header
        primary="Cycle Manager"
        secondary={
          <Text
            css={`
              ${textStyle('title2')}
            `}
          />
        }
      />
      <Box
        css={`
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          height: ${50 * GU}px;
          ${textStyle('title3')};
        `}
      >
        Cycle Length: {cycleLength} <br/>
        Pending Cycle Length: {pendingCycleLength} <br/>
        Current Cycle: {currentCycle} <br/>
        Current Cycle Start Time: {currentCycleStartTime} <br/>
        <Buttons>
          <Button
            label="Start Next Cycle"
            onClick={() => api.startNextCycle().toPromise()}
          />

          <div>
            <TextInput
              value={newCycleLength}
              onChange={event => {setNewCycleLength(event.target.value)}}
            />

            <Button
              css={`margin-left: 20px`}
              label="Update Cycle Length"
              onClick={() => api.updateCycleLength(newCycleLength).toPromise()}
            />
          </div>

        </Buttons>
      </Box>
    </Main>
  )
}

const Buttons = styled.div`
  display: grid;
  grid-auto-flow: row;
  grid-gap: 40px;
  margin-top: 20px;
`

export default App
