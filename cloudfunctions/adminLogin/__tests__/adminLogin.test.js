const assert = require('node:assert/strict')
const { __test__ } = require('../index')

async function shouldRejectNonAdmin() {
  const db = {
    collection(name) {
      assert.equal(name, 'admins')
      return {
        where(query) {
          assert.deepEqual(query, { openid: 'u1' })
          return { get: async () => ({ data: [] }) }
        }
      }
    }
  }

  const res = await __test__.adminLogin({
    db,
    getWXContext: () => ({ OPENID: 'u1' }),
    event: { password: '123' }
  })

  assert.equal(res.success, false)
  assert.equal(res.error, '无管理权限')
}

async function shouldRejectWrongPassword() {
  const db = {
    collection() {
      return {
        where() {
          return {
            get: async () => ({
              data: [{ name: 'owner', password: 'right-pass' }]
            })
          }
        }
      }
    }
  }

  const res = await __test__.adminLogin({
    db,
    getWXContext: () => ({ OPENID: 'u2' }),
    event: { password: 'wrong-pass' }
  })

  assert.equal(res.success, false)
  assert.equal(res.error, '密码错误')
}

async function shouldLoginWhenPasswordMatches() {
  const db = {
    collection() {
      return {
        where() {
          return {
            get: async () => ({
              data: [{ name: '老板', password: 'ok-pass' }]
            })
          }
        }
      }
    }
  }

  const res = await __test__.adminLogin({
    db,
    getWXContext: () => ({ OPENID: 'u3' }),
    event: { password: 'ok-pass' }
  })

  assert.deepEqual(res, { success: true, name: '老板' })
}

async function run() {
  await shouldRejectNonAdmin()
  await shouldRejectWrongPassword()
  await shouldLoginWhenPasswordMatches()
  console.log('adminLogin tests passed')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
