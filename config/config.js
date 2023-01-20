
const config = {
  production: {
    SECRET: process.env.SECRET,
    DATABASE: process.env.MONGODB_URI,
  },
  default: {
    SECRET: "mysecretkey",
    DATABASE: "mongodb+srv://shubham:RENXF27CJYnjSlhK@cluster0.woodiza.mongodb.net/test",
  },
};
exports.get = function get(env) { return config[env] || config.default; };
