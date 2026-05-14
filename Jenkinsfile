pipeline {
    agent any

    environment {
        FRONTEND_IMAGE = "iot-frontend:${env.BUILD_ID}"
        BACKEND_IMAGE = "iot-backend:${env.BUILD_ID}"
        SCANNER_HOME = tool 'SonarQubeScanner' // Descomentar cuando Sonar Scanner esté configurado en Global Tools
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        disableConcurrentBuilds()
        timeout(time: 30, unit: 'MINUTES')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install & Lint & Test') {
            parallel {
                stage('Frontend Quality') {
                    steps {
                        dir('frontend') {
                            sh 'npm ci'
                            sh 'npm run lint'
                            sh 'npm run test'
                        }
                    }
                }
                stage('Backend Quality') {
                    steps {
                        dir('backend') {
                            sh 'npm ci'
                            sh 'npm run lint'
                            sh 'npm run test:cov'
                        }
                    }
                }
            }
        }

        stage('Security Scan') {
            steps {
                dir('backend') { sh 'npm audit --audit-level=high' }
                dir('frontend') { sh 'npm audit --audit-level=high' }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                echo "Ejecutando análisis de SonarQube..."
                withSonarQubeEnv('SonarQubeServer') { 
                    sh "${SCANNER_HOME}/bin/sonar-scanner \
                        -Dsonar.projectKey=iot-platform \
                        -Dsonar.sources=frontend/src,backend/src \
                        -Dsonar.host.url=http://sonarqube:9000 \
                        -Dsonar.javascript.lcov.reportPaths=frontend/coverage/lcov.info,backend/coverage/lcov.info"
                }
            }
        }

        stage("Quality Gate") {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }   

        stage('Docker Build') {
            parallel {
                stage('Build Frontend') {
                    steps {
                        dir('frontend') {
                            sh "docker build -t ${FRONTEND_IMAGE} -t iot-frontend:latest ."
                        }
                    }
                }
                stage('Build Backend') {
                    steps {
                        dir('backend') {
                            sh "docker build -t ${BACKEND_IMAGE} -t iot-backend:latest ."
                        }
                    }
                }
            }
        }

        stage('Deploy Local (Staging)') {
            steps {
                sh 'docker-compose -f deploy/docker-compose.stg.yml up -d --force-recreate'
            }
        }

        stage('Health Checks') {
            steps {
                sleep time: 15, unit: 'SECONDS'
                sh "curl -f http://stg_backend:3000/api/v1/health"
                sh "curl -f http://stg_frontend:3000/api/health"
            }
        }
    }

    post {
        success {
            echo "✅ Pipeline completado exitosamente."
        }
        failure {
            echo "❌ Pipeline falló. Iniciando Rollback automático."
            sh 'docker-compose -f deploy/docker-compose.stg.yml down'
        }
    }
}
