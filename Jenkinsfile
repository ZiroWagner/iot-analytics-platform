pipeline {
    agent any

    tools {
        nodejs 'NodeJS_24'
    }

    environment {
        FRONTEND_IMAGE = "iot-frontend:${env.BUILD_ID}"
        BACKEND_IMAGE = "iot-backend:${env.BUILD_ID}"
        SCANNER_HOME = tool 'SonarQubeScanner' // Descomentar cuando Sonar Scanner esté configurado en Global Tools
        DEPLOY_STARTED = "false"
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        disableConcurrentBuilds()
        timeout(time: 30, unit: 'MINUTES')
    }

    stages {
        stage('Docker Test') {
            steps {
                sh 'docker version'
                sh 'docker ps'
            }
        }
        
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
                            sh 'npm run test:cov'
                        }
                    }
                }
                stage('Backend Quality') {
                    steps {
                        dir('backend') {
                            sh 'npm ci'
                            sh 'npx prisma generate'
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
                        -Dsonar.typescript.tsconfigPaths=frontend/tsconfig.sonar.json,backend/tsconfig.sonar.json \
                        -Dsonar.javascript.lcov.reportPaths=frontend/coverage/lcov.info,backend/coverage/lcov.info \
                        -Dsonar.qualitygate.wait=false"
                }
            }
        }

        stage("Quality Gate") {
            steps {
                withSonarQubeEnv('SonarQubeServer') {
                    timeout(time: 15, unit: 'MINUTES') {
                        sh '''
                            TASK_URL=$(grep '^ceTaskUrl=' .scannerwork/report-task.txt | cut -d= -f2-)
                            AUTH_ARGS=""

                            if [ -n "$SONAR_AUTH_TOKEN" ]; then
                                AUTH_ARGS="-u ${SONAR_AUTH_TOKEN}:"
                            fi

                            while true; do
                                RESPONSE=$(curl -sf $AUTH_ARGS "$TASK_URL")
                                STATUS=$(echo "$RESPONSE" | node -pe "JSON.parse(require('fs').readFileSync(0, 'utf8')).task.status")
                                echo "SonarQube Compute Engine task status: $STATUS"

                                if [ "$STATUS" = "SUCCESS" ]; then
                                    ANALYSIS_ID=$(echo "$RESPONSE" | node -pe "JSON.parse(require('fs').readFileSync(0, 'utf8')).task.analysisId")
                                    break
                                fi

                                if [ "$STATUS" = "FAILED" ] || [ "$STATUS" = "CANCELED" ]; then
                                    echo "$RESPONSE"
                                    exit 1
                                fi

                                sleep 10
                            done

                            GATE_RESPONSE=$(curl -sf $AUTH_ARGS "$SONAR_HOST_URL/api/qualitygates/project_status?analysisId=$ANALYSIS_ID")
                            GATE_STATUS=$(echo "$GATE_RESPONSE" | node -pe "JSON.parse(require('fs').readFileSync(0, 'utf8')).projectStatus.status")
                            echo "SonarQube Quality Gate status: $GATE_STATUS"

                            if [ "$GATE_STATUS" != "OK" ]; then
                                echo "$GATE_RESPONSE"
                                exit 1
                            fi
                        '''
                    }
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
                withCredentials([
                        string(credentialsId: 'NODE_ENV', variable: 'NODE_ENV'),
                        string(credentialsId: 'PORT', variable: 'PORT'),
                        string(credentialsId: 'DATABASE_URL', variable: 'DATABASE_URL'),
                        string(credentialsId: 'JWT_SECRET', variable: 'JWT_SECRET'),
                        string(credentialsId: 'JWT_EXPIRES_IN', variable: 'JWT_EXPIRES_IN'),
                        string(credentialsId: 'GOOGLE_CLIENT_ID', variable: 'GOOGLE_CLIENT_ID'),
                        string(credentialsId: 'GOOGLE_CLIENT_SECRET', variable: 'GOOGLE_CLIENT_SECRET'),
                        string(credentialsId: 'GOOGLE_CALLBACK_URL', variable: 'GOOGLE_CALLBACK_URL'),
                        string(credentialsId: 'GITHUB_CLIENT_ID', variable: 'GITHUB_CLIENT_ID'),
                        string(credentialsId: 'GITHUB_CLIENT_SECRET', variable: 'GITHUB_CLIENT_SECRET'),
                        string(credentialsId: 'GITHUB_CALLBACK_URL', variable: 'GITHUB_CALLBACK_URL'),
                        string(credentialsId: 'FRONTEND_URL', variable: 'FRONTEND_URL'),
                        string(credentialsId: 'NEXT_PUBLIC_API_URL', variable: 'NEXT_PUBLIC_API_URL'),
                        string(credentialsId: 'REDIS_HOST', variable: 'REDIS_HOST'),
                        string(credentialsId: 'REDIS_PORT', variable: 'REDIS_PORT')
                ]) {
                    sh '''
                        docker compose -f deploy/docker-compose.stg.yml up -d --force-recreate
                    '''
                    script { env.DEPLOY_STARTED = "true" }
                }
            }
        }

        stage('Health Checks') {
            steps {
                sleep time: 15, unit: 'SECONDS'
                sh "curl -f http://host.docker.internal:3001/api/v1/health"
                sh "curl -f http://host.docker.internal:3002/api/health"
            }
        }

        stage('Smoke E2E Tests') {
            steps {
                sh '''
                    docker run --rm \\
                        --network iot-net \\
                        -v "${WORKSPACE}/frontend:/app" \\
                        -w /app \\
                        -e CI=true \\
                        -e API_URL=http://backend:3000 \\
                        mcr.microsoft.com/playwright:v1.60.0 \\
                        sh -c "npm ci && npx playwright test --config=e2e/playwright.config.ts --reporter=list"
                '''
            }
        }
    }

    post {
        success {
            echo "✅ Pipeline completado exitosamente."
        }
        failure {
            echo "❌ Pipeline falló."
            script {
                if (env.DEPLOY_STARTED == "true") {
                    echo "Iniciando rollback automático porque el deploy alcanzó a iniciar."
                    sh 'docker compose -f deploy/docker-compose.stg.yml down'
                } else {
                    echo "No se ejecuta rollback porque el fallo ocurrió antes del deploy."
                }
            }
        }
    }
}
