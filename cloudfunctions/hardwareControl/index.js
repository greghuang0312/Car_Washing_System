let cloud = null

try {
  cloud = require('wx-server-sdk')
  cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
} catch (err) {
  // Allow local unit tests without installing cloud runtime deps.
}

async function hardwareControl({ event, logger = console.log }) {
  const { action, stationId } = event || {}
  logger(`[预留] 硬件控制: ${action} - 站点 ${stationId}`)
  return { success: true, mock: true, action, stationId }
}

exports.main = async (event) => {
  if (!cloud) {
    throw new Error('wx-server-sdk is not available in current runtime')
  }
  return hardwareControl({ event })
}

exports.__test__ = { hardwareControl }
