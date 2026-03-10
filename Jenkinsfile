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
                    echo "Building branch: ${env.GIT_BRANCH}"
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
                    docker build -t ${IMAGE_NAME}:${BUILD_NUMBER} .
                    docker tag ${IMAGE_NAME}:${BUILD_NUMBER} ${ECR_REPO}/${IMAGE_NAME}:${BUILD_NUMBER}
                    docker tag ${IMAGE_NAME}:${BUILD_NUMBER} ${ECR_REPO}/${IMAGE_NAME}:latest
                    docker tag ${IMAGE_NAME}:${BUILD_NUMBER} ${ECR_REPO}/${IMAGE_NAME}:dev
                    docker push ${ECR_REPO}/${IMAGE_NAME}:${BUILD_NUMBER}
                    docker push ${ECR_REPO}/${IMAGE_NAME}:latest
                    docker push ${ECR_REPO}/${IMAGE_NAME}:dev
                '''
            }
        }
        
        stage('Deploy to Dev') {
            when {
                anyOf {
                    branch 'develop'
                    branch 'master'
                }
            }
            steps {
                deployToDev()
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

def deployToDev() {
    sh """
        aws eks update-kubeconfig --region ${AWS_REGION} --name tresvita-todo-app-dev
        
        echo "Deploying Frontend to DEV environment..."
        helm upgrade --install ${APP_NAME} ../infra-eks-terraform/helm_charts/todo-frontend \
          --namespace frontend \
          --values ../infra-eks-terraform/helm_charts/todo-frontend/values-dev.yaml \
          --set image.repository=${ECR_REPO}/${IMAGE_NAME} \
          --set image.tag=dev \
          --wait --timeout 5m
        
        echo ""
        echo "Waiting for ALB..."
        sleep 30
        
        echo ""
        echo "Getting ALB URL..."
        ALB_URL=\\$(kubectl get ingress ${APP_NAME} -n frontend -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "Pending")
        echo "Frontend URL: http://\\${ALB_URL}"
        
        echo ""
        kubectl get pods -n frontend
        kubectl get svc -n frontend
        kubectl get ingress -n frontend
    """
    
    echo ""
    echo "========================================="
    echo "FRONTEND DEPLOYED TO DEV"
    echo "========================================="
    echo "To get ALB URL: kubectl get ingress tresvita-todo-frontend -n frontend"
    echo "========================================="
}
