import * as algokit from '@algorandfoundation/algokit-utils'
import { CounterClient } from '../artifacts/counter/client'

// Below is a showcase of various deployment options you can use in TypeScript Client
export async function deploy() {
  console.log('=== Deploying Counter ===')

  const algod = algokit.getAlgoClient()
  const indexer = algokit.getAlgoIndexerClient()
  const deployer = await algokit.getAccount(
    { config: algokit.getAccountConfigFromEnvironment('DEPLOYER'), fundWith: algokit.algos(3) },
    algod,
  )
  await algokit.ensureFunded(
    {
      accountToFund: deployer,
      minSpendingBalance: algokit.algos(2),
      minFundingIncrement: algokit.algos(2),
    },
    algod,
  )
  const appClient = new CounterClient(
    {
      resolveBy: 'creatorAndName',
      findExistingUsing: indexer,
      sender: deployer,
      creatorAddress: deployer.addr,
    },
    algod,
  )

  const app = await appClient.deploy({
    onSchemaBreak: 'append',
    onUpdate: 'append',
  })

  // If app was just created fund the app account
  if (['create', 'replace'].includes(app.operationPerformed)) {
    algokit.transferAlgos(
      {
        amount: algokit.algos(1),
        from: deployer,
        to: app.appAddress,
      },
      algod,
    )
  }

  const method = 'increment'
  const response = await appClient.increment({})
  console.log(`Called ${method} on ${app.name} (${app.appId}) received: ${response.return}`)
}
