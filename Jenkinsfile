#!/usr/bin/env groovy

pipeline {
    agent any
    
    environment {
        AWS_REGION = 'us-west-2'
        AWS_ACCOUNT_ID = credentials('aws-account-id')
        ECR_REPO = "${AWS_ACCOUNT_ID}.dkr.ecr.us-west-2.amazonaws.com"
        IMAGE_NAME = 'tresvita-todo-frontend'
        APP_NAME = 'tresvita-todo-frontend'
    }
    
    options {
        buildDiscarder(logRotator(numToKeepStr: '20'))
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
    }
    
    triggers {
        githubPush()
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    // Determine environment from branch
                    env.GIT_BRANCH = sh(returnStdout: true, script: 'git rev-parse --abbrev-ref HEAD').trim()
                    env.DEPLOY_ENV = env.GIT_BRANCH == 'main' ? 'prod' : 
                                     env.GIT_BRANCH == 'staging' ? 'staging' : 'dev'
                    env.IMAGE_TAG = "${DEPLOY_ENV}-${BUILD_NUMBER}"
                    echo "Branch: ${GIT_BRANCH}, Deploy Env: ${DEPLOY_ENV}, Image Tag: ${IMAGE_TAG}"
                }
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh '''
                    npm ci
                '''
            }
        }
        
        stage('Lint & Test') {
            steps {
                sh '''
                    npm run lint || true
                    npm test -- --coverage --watchAll=false || true
                '''
            }
            post {
                always {
                    publishHTML([
                        allowMissing: true,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'coverage',
                        reportFiles: 'index.html',
                        reportName: 'Coverage Report'
                    ])
                }
            }
        }
        
        stage('Build App') {
            steps {
                sh '''
                    npm run build
                '''
            }
        }
        
        stage('Docker Build & Push') {
            steps {
                script {
                    // Login to ECR
                    sh '''
                        aws ecr get-login-password --region ${AWS_REGION} | \
                        docker login --username AWS --password-stdin ${ECR_REPO}
                    '''
                    
                    // Build Docker image
                    sh '''
                        docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .
                        docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${ECR_REPO}/${IMAGE_NAME}:${IMAGE_TAG}
                        docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${ECR_REPO}/${IMAGE_NAME}:latest
                        docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${ECR_REPO}/${IMAGE_NAME}:${DEPLOY_ENV}
                    '''
                    
                    // Push to ECR
                    sh '''
                        docker push ${ECR_REPO}/${IMAGE_NAME}:${IMAGE_TAG}
                        docker push ${ECR_REPO}/${IMAGE_NAME}:latest
                        docker push ${ECR_REPO}/${IMAGE_NAME}:${DEPLOY_ENV}
                    '''
                }
            }
        }
        
        stage('Security Scan') {
            steps {
                sh '''
                    # Install Trivy if not present
                    which trivy || curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh
                    
                    # Scan image
                    trivy image --severity HIGH,CRITICAL --exit-code 0 \
                      ${ECR_REPO}/${IMAGE_NAME}:${IMAGE_TAG} || true
                '''
            }
        }
        
        stage('Deploy to Dev') {
            when {
                branch 'develop'
            }
            steps {
                deployHelm('dev')
            }
        }
        
        stage('Deploy to Staging') {
            when {
                branch 'staging'
            }
            steps {
                deployHelm('staging')
            }
        }
        
        stage('Approval for Production') {
            when {
                branch 'main'
            }
            steps {
                input message: 'Deploy to Production?', ok: 'Deploy'
            }
        }
        
        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            steps {
                deployHelm('prod')
            }
        }
    }
    
    post {
        success {
            echo "✅ Build ${BUILD_NUMBER} successful!"
            echo "Image: ${ECR_REPO}/${IMAGE_NAME}:${IMAGE_TAG}"
        }
        failure {
            echo "❌ Build ${BUILD_NUMBER} failed!"
        }
        always {
            cleanWs()
        }
    }
}

def deployHelm(environment) {
    sh """
        aws eks update-kubeconfig --region ${AWS_REGION} --name tresvita-todo-app-${environment}
        
        helm upgrade --install ${APP_NAME} \
          ../infra-eks-terraform/helm_charts/todo-frontend \
          --namespace frontend \
          --set image.repository=${ECR_REPO}/${IMAGE_NAME} \
          --set image.tag=${IMAGE_TAG} \
          --set replicaCount=${environment == 'prod' ? 3 : 2} \
          --set ingress.hosts[0].host=app-${environment}.tresvita.local \
          --set env[0].name=REACT_APP_API_URL,env[0].value=http://api-${environment}.tresvita.local/api \
          --wait \
          --timeout 5m \
          --atomic
        
        kubectl rollout status deployment/${APP_NAME} -n frontend --timeout=300s
        kubectl get svc -n frontend
        kubectl get ingress -n frontend
    """
}
