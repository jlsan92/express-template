
const config = ({ Joi, statics }) => {
  const { environments } = statics;

  const configSchema = Joi.object({
    NODE_ENV: Joi.string()
      .allow(Object.values(environments))
      .default(environments.development),

    PORT: Joi.number()
      .default(3000),

    JWT_SECRET: Joi.string().required()
      .description('JWT required to sign sessions'),

  }).unknown()
    .required();

  const { error, value: configVars } = Joi.validate(process.env, configSchema);
  if (error) {
    throw new Error(`Config validation error: ${error.message}`);
  }

  return {
    env: configVars.NODE_ENV,
    port: configVars.PORT,
    jwtSecret: configVars.JWT_SECRET,
  };
};

module.exports = config;
