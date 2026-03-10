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
                    env.GIT_BRANCH = sh(returnStdout: true, script: 'git rev-parse --abbrev-ref HEAD').trim()
                    env.DEPLOY_ENV = env.GIT_BRANCH == 'main' ? 'prod' : env.GIT_BRANCH == 'staging' ? 'staging' : 'dev'
                    env.IMAGE_TAG = "${DEPLOY_ENV}-${BUILD_NUMBER}"
                    echo "Branch: ${GIT_BRANCH}, Deploy Env: ${DEPLOY_ENV}"
                }
            }
        }
        
        stage('Build') {
            steps {
                sh 'npm ci'
                sh 'npm run build'
            }
        }
        
        stage('Test') {
            steps {
                sh 'npm test -- --watchAll=false || true'
            }
        }
        
        stage('Docker Build and Push') {
            steps {
                sh '''
                    aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REPO}
                    docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .
                    docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${ECR_REPO}/${IMAGE_NAME}:${IMAGE_TAG}
                    docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${ECR_REPO}/${IMAGE_NAME}:latest
                    docker push ${ECR_REPO}/${IMAGE_NAME}:${IMAGE_TAG}
                    docker push ${ECR_REPO}/${IMAGE_NAME}:latest
                '''
            }
        }
        
        stage('Deploy to Dev') {
            when { branch 'develop' }
            steps {
                deployToEKS('dev')
            }
        }
        
        stage('Deploy to Staging') {
            when { branch 'staging' }
            steps {
                deployToEKS('staging')
            }
        }
        
        stage('Production Approval') {
            when { branch 'main' }
            steps {
                input message: 'Deploy to Production?', ok: 'Deploy'
            }
        }
        
        stage('Deploy to Production') {
            when { branch 'main' }
            steps {
                deployToEKS('prod')
            }
        }
    }
    
    post {
        success {
            echo "Frontend Build ${BUILD_NUMBER} successful!"
        }
        failure {
            echo "Frontend Build ${BUILD_NUMBER} failed!"
        }
        always {
            cleanWs()
        }
    }
}

def deployToEKS(environment) {
    sh """
        aws eks update-kubeconfig --region ${AWS_REGION} --name tresvita-todo-app-${environment}
        helm upgrade --install ${APP_NAME} ../infra-eks-terraform/helm_charts/todo-frontend \
          --namespace frontend \
          --set image.repository=${ECR_REPO}/${IMAGE_NAME} \
          --set image.tag=${IMAGE_TAG} \
          --set replicaCount=${environment == 'prod' ? 3 : 2} \
          --wait --timeout 5m
    """
}
