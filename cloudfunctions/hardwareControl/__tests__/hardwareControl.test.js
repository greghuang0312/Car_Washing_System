const assert = require('node:assert/strict')
const { __test__ } = require('../index')

async function shouldReturnMockSuccess() {
  const logs = []
  const res = await __test__.hardwareControl({
    event: { action: 'open_door', stationId: 'station_01' },
    logger: (msg) => logs.push(msg)
  })

  assert.equal(res.success, true)
  assert.equal(res.mock, true)
  assert.equal(res.action, 'open_door')
  assert.equal(res.stationId, 'station_01')
  assert.equal(logs.length, 1)
}

async function run() {
  await shouldReturnMockSuccess()
  console.log('hardwareControl tests passed')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
