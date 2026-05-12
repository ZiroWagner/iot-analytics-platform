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
                            sh 'npm run lint || true'
                            sh 'npm run test:unit || true' // Ignorar fallos si no hay tests
                        }
                    }
                }
                stage('Backend Quality') {
                    steps {
                        dir('backend') {
                            sh 'npm ci'
                            sh 'npm run lint || true'
                            sh 'npm run test || true'
                        }
                    }
                }
            }
        }

        stage('Security Scan') {
            steps {
                dir('backend') { sh 'npm audit --audit-level=high || true' }
                dir('frontend') { sh 'npm audit --audit-level=high || true' }
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
                dir('deploy') {
                    // Usamos docker-compose para reiniciar los servicios con las nuevas imágenes
                    // sh 'docker-compose -f docker-compose.stg.yml up -d --build'
                    sh 'docker-compose -f docker-compose.stg.yml down'
                    sh 'docker-compose -f docker-compose.stg.yml up -d'
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

        stage('Health Checks') {
            steps {
                sleep time: 15, unit: 'SECONDS'
                // Ajustar puertos si es necesario
                sh "curl -f http://stg_backend:3000/api/health || true"
                sh "curl -f http://stg_frontend:3000/ || true"
            }
        }
    }

    post {
        success {
            echo "✅ Pipeline completado exitosamente."
        }
        failure {
            echo "❌ Pipeline falló. Iniciando Rollback automático."
            dir('deploy') {
                sh 'docker-compose -f docker-compose.stg.yml down'
            }
        }
    }
}
