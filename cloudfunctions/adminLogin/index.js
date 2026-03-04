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
  const { password } = event || {}

  const result = await db.collection('admins').where({ openid }).get()
  if (result.data.length === 0) {
    return { success: false, error: '无管理权限' }
  }

  const admin = result.data[0]
  if (admin.password !== password) {
    return { success: false, error: '密码错误' }
  }

  return { success: true, name: admin.name }
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
