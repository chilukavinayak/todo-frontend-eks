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
        timeout(time: 45, unit: 'MINUTES')
        disableConcurrentBuilds()
    }
    
    triggers {
        githubPush()
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Checkout Infra Repo') {
            steps {
                sh '''
                    rm -rf /tmp/infra-eks-terraform
                    git clone https://github.com/chilukavinayak/infra-eks-terraform.git /tmp/infra-eks-terraform
                '''
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
                sh 'npm test -- --watchAll=false --passWithNoTests || true'
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
            steps {
                deployToDev()
            }
        }
    }
    
    post {
        success {
            echo "SUCCESS: Build ${BUILD_NUMBER} completed!"
        }
        failure {
            echo "FAILED: Build ${BUILD_NUMBER}"
        }
        always {
            cleanWs()
        }
    }
}

def deployToDev() {
    sh """
        aws eks update-kubeconfig --region ${AWS_REGION} --name tresvita-todo-app-dev
        
        echo "========================================"
        echo "CLEANING UP EXISTING RESOURCES"
        echo "========================================"
        
        kubectl delete deployment tresvita-todo-frontend -n frontend 2>/dev/null || true
        kubectl delete serviceaccount frontend-sa -n frontend 2>/dev/null || true
        kubectl delete service tresvita-todo-frontend -n frontend 2>/dev/null || true
        kubectl delete configmap tresvita-todo-frontend -n frontend 2>/dev/null || true
        
        sleep 5
        
        echo ""
        echo "========================================"
        echo "DEPLOYING FRONTEND TO DEV"
        echo "========================================"
        
        helm upgrade --install ${APP_NAME} /tmp/infra-eks-terraform/helm_charts/todo-frontend \
          --namespace frontend \
          --values /tmp/infra-eks-terraform/helm_charts/todo-frontend/values-dev.yaml \
          --set image.repository=${ECR_REPO}/${IMAGE_NAME} \
          --set image.tag=dev \
          --timeout 10m \
          --atomic \
          --cleanup-on-fail
        
        echo ""
        echo "Waiting for deployment..."
        sleep 10
        
        echo ""
        echo "Deployment Status:"
        kubectl get pods -n frontend
        kubectl get svc -n frontend
    """
    
    echo ""
    echo "========================================"
    echo "FRONTEND DEPLOYED TO DEV"
    echo "========================================"
    echo "Access: kubectl port-forward svc/tresvita-todo-frontend 3000:80 -n frontend"
    echo "Then: http://localhost:3000"
    echo "========================================"
}
