const db = require('./db')
const lib = require('./lib')

const auth = module.exports = {

    handle: function(env) {

         switch(env.req.method) {
            case 'GET':
                lib.sendJson(env.res, lib.sessions[env.session])
                break
            case 'POST':
                db.users.findOne({ login: env.payload.login, password: env.payload.password }, function(err, doc) {
                    if(!err && doc) {
                        lib.sessions[env.session].login = env.payload.login
                        lib.sessions[env.session].roles = doc.roles
                        lib.sendJson(env.res, lib.sessions[env.session])
                    } else {
                        lib.sendError(env.res, 401, 'authorization failed')
                    }
                })
                break
            case 'DELETE':
                delete lib.sessions[env.session].login
                delete lib.sessions[env.session].roles
                lib.sendJson(env.res, lib.sessions[env.session])
                break
            default:
                lib.sendError(env.res, 405, 'method not implemented')
        }
    }
}