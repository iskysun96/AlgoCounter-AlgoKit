import * as algokit from '@algorandfoundation/algokit-utils'
import { TransactionSignerAccount } from '@algorandfoundation/algokit-utils/types/account'
import { AppDetails } from '@algorandfoundation/algokit-utils/types/app-client'
import { useWallet } from '@txnlab/use-wallet'
import { useSnackbar } from 'notistack'
import { useState } from 'react'
import { CounterClient } from '../contracts/Counter'

import { getAlgodConfigFromViteEnvironment, getIndexerConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'

const Counter = () => {
  const [loading, setLoading] = useState<boolean>(false)
  const [count, setCount] = useState<number>(0)

  const algodConfig = getAlgodConfigFromViteEnvironment()
  const algodClient = algokit.getAlgoClient({
    server: algodConfig.server,
    port: algodConfig.port,
    token: algodConfig.token,
  })

  const indexerConfig = getIndexerConfigFromViteEnvironment()
  const indexer = algokit.getAlgoIndexerClient({
    server: indexerConfig.server,
    port: indexerConfig.port,
    token: indexerConfig.token,
  })

  const { enqueueSnackbar } = useSnackbar()
  const { signer, activeAddress } = useWallet()

  const sendAppCall = async () => {
    setLoading(true)

    const appDetails = {
      resolveBy: 'creatorAndName',
      sender: { signer, addr: activeAddress } as TransactionSignerAccount,
      creatorAddress: activeAddress,
      findExistingUsing: indexer,
    } as AppDetails

    const appClient = new CounterClient(appDetails, algodClient)

    console.log('before deploy')
    await appClient
      .deploy({
        onSchemaBreak: 'append',
        onUpdate: 'append',
      })
      .catch((e: Error) => {
        enqueueSnackbar(`Error deploying the contract: ${e.message}`, { variant: 'error' })
        setLoading(false)
        return
      })
    console.log('after deploy')

    const response = await appClient.increment({}).catch((e: Error) => {
      enqueueSnackbar(`Error calling the contract: ${e.message}`, { variant: 'error' })
      setLoading(false)
      return
    })

    const globalState = await appClient.getGlobalState()
    globalState.counter

    if (response?.return !== undefined) {
      setCount(Number(response.return))
      enqueueSnackbar(`Response from the contract: ${response.return}`, { variant: 'success' })
    } else {
      // Handle the case where `response` is void
      enqueueSnackbar('No response from the contract', { variant: 'info' })
    }
    setLoading(false)
  }
  return (
    <div>
      <button className={`btn`} onClick={sendAppCall}>
        {loading ? (
          <span className="loading loading-spinner" />
        ) : count == 0 ? (
          <h3 className="font-bold text-lg">Continue Counting!</h3>
        ) : (
          <h3 className="font-bold text-lg">{count}</h3>
        )}
      </button>
    </div>
  )
}

export default Counter
