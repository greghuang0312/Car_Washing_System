let cloud = null
let db = null

try {
  cloud = require('wx-server-sdk')
  cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
  db = cloud.database()
} catch (err) {
  // Allow local unit tests without installing cloud runtime deps.
}

async function adminLogin({ db, getWXContext, event }) {
  const wxContext = getWXContext()
  const openid = wxContext.OPENID

  const result = await db.collection('admins').where({ openid }).get()
  if (result.data.length === 0) {
    return { success: false, error: '无管理权限', openid }
  }

  const admin = result.data[0]
  return { success: true, name: admin.name, openid }
}

exports.main = async (event) => {
  if (!cloud || !db) {
    throw new Error('wx-server-sdk is not available in current runtime')
  }
  return adminLogin({
    db,
    getWXContext: cloud.getWXContext,
    event
  })
}

exports.__test__ = { adminLogin }
