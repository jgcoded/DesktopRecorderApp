type Environment = 'production' | 'development';

export default class EnvironmentService {
  public static getCurrentEnvironment(): Environment {
    const env = process.env.NODE_ENV;
    switch (env) {
      case 'development':
      case 'production':
        return env;
      default:
        return 'production';
    }
  }

  public static isEnvironment(environment: Environment): boolean {
    return this.getCurrentEnvironment() === environment;
  }
}
