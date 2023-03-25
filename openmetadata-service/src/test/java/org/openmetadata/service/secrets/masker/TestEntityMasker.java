package org.openmetadata.service.secrets.masker;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.openmetadata.schema.api.services.DatabaseConnection;
import org.openmetadata.schema.auth.JWTAuthMechanism;
import org.openmetadata.schema.auth.SSOAuthMechanism;
import org.openmetadata.schema.entity.automations.TestServiceConnectionRequest;
import org.openmetadata.schema.entity.automations.Workflow;
import org.openmetadata.schema.entity.services.ServiceType;
import org.openmetadata.schema.entity.services.ingestionPipelines.IngestionPipeline;
import org.openmetadata.schema.entity.services.ingestionPipelines.PipelineType;
import org.openmetadata.schema.entity.teams.AuthenticationMechanism;
import org.openmetadata.schema.metadataIngestion.DbtPipeline;
import org.openmetadata.schema.metadataIngestion.SourceConfig;
import org.openmetadata.schema.metadataIngestion.dbtconfig.DbtGCSConfig;
import org.openmetadata.schema.security.SecurityConfiguration;
import org.openmetadata.schema.security.client.GoogleSSOClientConfig;
import org.openmetadata.schema.security.credentials.AWSCredentials;
import org.openmetadata.schema.security.credentials.GCSCredentials;
import org.openmetadata.schema.security.credentials.GCSValues;
import org.openmetadata.schema.services.connections.dashboard.SupersetConnection;
import org.openmetadata.schema.services.connections.database.BigQueryConnection;
import org.openmetadata.schema.services.connections.database.DatalakeConnection;
import org.openmetadata.schema.services.connections.database.MysqlConnection;
import org.openmetadata.schema.services.connections.database.datalake.GCSConfig;
import org.openmetadata.schema.services.connections.metadata.OpenMetadataConnection;
import org.openmetadata.schema.services.connections.pipeline.AirflowConnection;

abstract class TestEntityMasker {

  private static final String PASSWORD = "PASSWORD";

  protected static SecurityConfiguration config = new SecurityConfiguration();

  public TestEntityMasker() {}

  @AfterAll
  static void afterAll() {
    EntityMaskerFactory.setEntityMasker(null);
  }

  @Test
  void testAirflowConnectionMasker() {
    AirflowConnection airflowConnection = new AirflowConnection().withConnection(buildMysqlConnection());
    AirflowConnection masked =
        (AirflowConnection)
            EntityMaskerFactory.createEntityMasker(config)
                .maskServiceConnectionConfig(airflowConnection, "Airflow", ServiceType.PIPELINE);
    assertNotNull(masked);
    assertEquals(((MysqlConnection) masked.getConnection()).getPassword(), getMaskedPassword());
    AirflowConnection unmasked =
        (AirflowConnection)
            EntityMaskerFactory.createEntityMasker(config)
                .unmaskServiceConnectionConfig(masked, airflowConnection, "Airflow", ServiceType.PIPELINE);
    assertEquals(((MysqlConnection) unmasked.getConnection()).getPassword(), PASSWORD);
  }

  @Test
  void testBigQueryConnectionMasker() {
    BigQueryConnection bigQueryConnection = new BigQueryConnection().withCredentials(buildGcsCredentials());
    BigQueryConnection masked =
        (BigQueryConnection)
            EntityMaskerFactory.createEntityMasker(config)
                .maskServiceConnectionConfig(bigQueryConnection, "BigQuery", ServiceType.DATABASE);
    assertNotNull(masked);
    assertEquals(getPrivateKeyFromGcsConfig(masked.getCredentials()), getMaskedPassword());
    BigQueryConnection unmasked =
        (BigQueryConnection)
            EntityMaskerFactory.createEntityMasker(config)
                .unmaskServiceConnectionConfig(masked, bigQueryConnection, "BigQuery", ServiceType.DATABASE);
    assertEquals(getPrivateKeyFromGcsConfig(unmasked.getCredentials()), PASSWORD);
  }

  @Test
  void testDatalakeConnectionMasker() {
    DatalakeConnection datalakeConnection = new DatalakeConnection().withConfigSource(buildGcsConfig());
    DatalakeConnection masked =
        (DatalakeConnection)
            EntityMaskerFactory.createEntityMasker(config)
                .maskServiceConnectionConfig(datalakeConnection, "Datalake", ServiceType.DATABASE);
    assertNotNull(masked);
    assertEquals(
        getPrivateKeyFromGcsConfig(((GCSConfig) masked.getConfigSource()).getSecurityConfig()), getMaskedPassword());
    DatalakeConnection unmasked =
        (DatalakeConnection)
            EntityMaskerFactory.createEntityMasker(config)
                .unmaskServiceConnectionConfig(masked, datalakeConnection, "Datalake", ServiceType.DATABASE);
    assertEquals(getPrivateKeyFromGcsConfig(((GCSConfig) unmasked.getConfigSource()).getSecurityConfig()), PASSWORD);
  }

  @Test
  void testDbtPipelineMasker() {
    IngestionPipeline dbtPipeline = buildIngestionPipeline();
    IngestionPipeline originalDbtPipeline = buildIngestionPipeline();
    EntityMaskerFactory.createEntityMasker(config).maskIngestionPipeline(dbtPipeline);
    assertNotNull(dbtPipeline);
    assertEquals(
        getPrivateKeyFromGcsConfig(
            ((DbtGCSConfig) ((DbtPipeline) dbtPipeline.getSourceConfig().getConfig()).getDbtConfigSource())
                .getDbtSecurityConfig()),
        getMaskedPassword());
    assertEquals(
        ((AWSCredentials) dbtPipeline.getOpenMetadataServerConnection().getSecretsManagerCredentials())
            .getAwsSecretAccessKey(),
        getMaskedPassword());
    assertEquals(
        ((GoogleSSOClientConfig) dbtPipeline.getOpenMetadataServerConnection().getSecurityConfig()).getSecretKey(),
        getMaskedPassword());
    EntityMaskerFactory.createEntityMasker(config).unmaskIngestionPipeline(dbtPipeline, originalDbtPipeline);
    assertEquals(
        getPrivateKeyFromGcsConfig(
            ((DbtGCSConfig) ((DbtPipeline) dbtPipeline.getSourceConfig().getConfig()).getDbtConfigSource())
                .getDbtSecurityConfig()),
        PASSWORD);
    assertEquals(
        ((AWSCredentials) dbtPipeline.getOpenMetadataServerConnection().getSecretsManagerCredentials())
            .getAwsSecretAccessKey(),
        PASSWORD);
    assertEquals(
        ((GoogleSSOClientConfig) dbtPipeline.getOpenMetadataServerConnection().getSecurityConfig()).getSecretKey(),
        PASSWORD);
  }

  @Test
  void testSSOAuthenticationMechanismMasker() {
    AuthenticationMechanism authenticationMechanism =
        buildAuthenticationMechanism(AuthenticationMechanism.AuthType.SSO);
    AuthenticationMechanism originalSsoAuthenticationMechanism =
        buildAuthenticationMechanism(AuthenticationMechanism.AuthType.SSO);
    EntityMaskerFactory.createEntityMasker(config).maskAuthenticationMechanism("test", authenticationMechanism);
    assertNotNull(authenticationMechanism.getConfig());
    assertEquals(
        ((GoogleSSOClientConfig) ((SSOAuthMechanism) authenticationMechanism.getConfig()).getAuthConfig())
            .getSecretKey(),
        getMaskedPassword());
    EntityMaskerFactory.createEntityMasker(config)
        .unmaskAuthenticationMechanism("test", authenticationMechanism, originalSsoAuthenticationMechanism);
    assertEquals(
        ((GoogleSSOClientConfig) ((SSOAuthMechanism) authenticationMechanism.getConfig()).getAuthConfig())
            .getSecretKey(),
        PASSWORD);
  }

  @Test
  void testJUTAAuthenticationMechanismMasker() {
    AuthenticationMechanism authenticationMechanism =
        buildAuthenticationMechanism(AuthenticationMechanism.AuthType.JWT);
    AuthenticationMechanism originalSsoAuthenticationMechanism =
        buildAuthenticationMechanism(AuthenticationMechanism.AuthType.JWT);
    EntityMaskerFactory.createEntityMasker(config).maskAuthenticationMechanism("test", authenticationMechanism);
    assertTrue(authenticationMechanism.getConfig() instanceof JWTAuthMechanism);
    EntityMaskerFactory.createEntityMasker(config)
        .unmaskAuthenticationMechanism("test", authenticationMechanism, originalSsoAuthenticationMechanism);
    assertTrue(authenticationMechanism.getConfig() instanceof JWTAuthMechanism);
  }

  @Test
  void testSupersetConnectionMasker() {
    SupersetConnection supersetConnection = new SupersetConnection().withConnection(buildMysqlConnection());
    SupersetConnection masked =
        (SupersetConnection)
            EntityMaskerFactory.createEntityMasker(config)
                .maskServiceConnectionConfig(supersetConnection, "Superset", ServiceType.DASHBOARD);
    assertNotNull(masked);
    assertEquals(((MysqlConnection) masked.getConnection()).getPassword(), getMaskedPassword());
    SupersetConnection unmasked =
        (SupersetConnection)
            EntityMaskerFactory.createEntityMasker(config)
                .unmaskServiceConnectionConfig(masked, supersetConnection, "Superset", ServiceType.DASHBOARD);
    assertEquals(((MysqlConnection) unmasked.getConnection()).getPassword(), PASSWORD);
  }

  @Test
  void testWorkflowMasker() {
    Workflow workflow =
        new Workflow()
            .withRequest(
                new TestServiceConnectionRequest()
                    .withConnection(new DatabaseConnection().withConfig(buildMysqlConnection()))
                    .withServiceType(ServiceType.DATABASE)
                    .withConnectionType("Mysql"))
            .withOpenMetadataServerConnection(buildOpenMetadataConnection());
    Workflow masked = EntityMaskerFactory.createEntityMasker(config).maskWorkflow(workflow);
    assertNotNull(masked);
    assertEquals(
        ((MysqlConnection)
                ((DatabaseConnection) ((TestServiceConnectionRequest) masked.getRequest()).getConnection()).getConfig())
            .getPassword(),
        getMaskedPassword());
    assertEquals(
        ((AWSCredentials) masked.getOpenMetadataServerConnection().getSecretsManagerCredentials())
            .getAwsSecretAccessKey(),
        getMaskedPassword());
    assertEquals(
        ((GoogleSSOClientConfig) masked.getOpenMetadataServerConnection().getSecurityConfig()).getSecretKey(),
        getMaskedPassword());
    Workflow unmasked = EntityMaskerFactory.createEntityMasker(config).unmaskWorkflow(masked, workflow);
    assertEquals(
        ((MysqlConnection)
                ((DatabaseConnection) ((TestServiceConnectionRequest) unmasked.getRequest()).getConnection())
                    .getConfig())
            .getPassword(),
        PASSWORD);
    assertEquals(
        ((AWSCredentials) unmasked.getOpenMetadataServerConnection().getSecretsManagerCredentials())
            .getAwsSecretAccessKey(),
        PASSWORD);
    assertEquals(
        ((GoogleSSOClientConfig) unmasked.getOpenMetadataServerConnection().getSecurityConfig()).getSecretKey(),
        PASSWORD);
  }

  @Test
  void testObjectMaskerWithoutACustomClassConverter() {
    MysqlConnection mysqlConnection = buildMysqlConnection();
    MysqlConnection masked =
        (MysqlConnection)
            EntityMaskerFactory.createEntityMasker(config)
                .maskServiceConnectionConfig(mysqlConnection, "Mysql", ServiceType.DATABASE);
    assertNotNull(masked);
    assertEquals(masked.getPassword(), getMaskedPassword());
    MysqlConnection unmasked =
        (MysqlConnection)
            EntityMaskerFactory.createEntityMasker(config)
                .unmaskServiceConnectionConfig(masked, mysqlConnection, "Mysql", ServiceType.DATABASE);
    assertEquals(unmasked.getPassword(), PASSWORD);
  }

  protected String getMaskedPassword() {
    return PASSWORD;
  }

  private GCSCredentials buildGcsCredentials() {
    return new GCSCredentials().withGcsConfig(new GCSValues().withPrivateKey(PASSWORD));
  }

  private MysqlConnection buildMysqlConnection() {
    return new MysqlConnection().withPassword(PASSWORD);
  }

  private GCSConfig buildGcsConfig() {
    return new GCSConfig().withSecurityConfig(buildGcsCredentials());
  }

  private String getPrivateKeyFromGcsConfig(GCSCredentials masked) {
    return ((GCSValues) masked.getGcsConfig()).getPrivateKey();
  }

  private IngestionPipeline buildIngestionPipeline() {
    return new IngestionPipeline()
        .withPipelineType(PipelineType.DBT)
        .withSourceConfig(
            new SourceConfig()
                .withConfig(
                    new DbtPipeline()
                        .withDbtConfigSource(new DbtGCSConfig().withDbtSecurityConfig(buildGcsCredentials()))))
        .withOpenMetadataServerConnection(buildOpenMetadataConnection());
  }

  private OpenMetadataConnection buildOpenMetadataConnection() {
    return new OpenMetadataConnection()
        .withSecretsManagerCredentials(new AWSCredentials().withAwsSecretAccessKey(PASSWORD))
        .withSecurityConfig(buildGoogleSSOClientConfig());
  }

  private GoogleSSOClientConfig buildGoogleSSOClientConfig() {
    return new GoogleSSOClientConfig().withSecretKey(PASSWORD);
  }

  private AuthenticationMechanism buildAuthenticationMechanism(AuthenticationMechanism.AuthType type) {
    return new AuthenticationMechanism()
        .withAuthType(type)
        .withConfig(
            type == AuthenticationMechanism.AuthType.SSO
                ? new SSOAuthMechanism().withAuthConfig(buildGoogleSSOClientConfig())
                : new JWTAuthMechanism().withJWTToken(PASSWORD));
  }
}
