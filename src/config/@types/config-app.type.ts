export type ConfigAppProviderType = {
  database: {
    connection: string;
    username: string;
    password: string;
    authSource: string;
  };
  jwt: {
    secretKey: string;
    expires: number;
  };
  node_env: 'production' | 'development';
  origin: RegExp;
  port: number;
  storage_hostname: string;
  rabbitmq: {
    endpoint: string;
    username: string;
    password: string;
  };
  ml_endpoint: string;
  minio: {
    endpoint: string;
    access_key: string;
    secret_key: string;
    port: number;
    ssl: boolean;
  };
  tmp_video_server: string;
};
