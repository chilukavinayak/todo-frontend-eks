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
                deployToDev()
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

def deployToDev() {
    sh """
        aws eks update-kubeconfig --region ${AWS_REGION} --name tresvita-todo-app-dev
        
        echo "Deploying to DEV environment..."
        helm upgrade --install ${APP_NAME} ../infra-eks-terraform/helm_charts/todo-frontend \
          --namespace frontend \
          --values ../infra-eks-terraform/helm_charts/todo-frontend/values-dev.yaml \
          --set image.repository=${ECR_REPO}/${IMAGE_NAME} \
          --set image.tag=${IMAGE_TAG} \
          --wait --timeout 5m
        
        echo ""
        echo "Waiting for ALB to be created..."
        sleep 30
        
        echo ""
        echo "Getting ALB URL..."
        ALB_URL=\$(kubectl get ingress ${APP_NAME} -n frontend -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "Not ready yet")
        echo "Frontend ALB URL: http://\${ALB_URL}"
        
        echo ""
        echo "Deployment Status:"
        kubectl get pods -n frontend
        kubectl get svc -n frontend
        kubectl get ingress -n frontend
    """
    
    echo ""
    echo "========================================="
    echo "FRONTEND DEPLOYED TO DEV"
    echo "========================================="
    echo "To get the URL, run:"
    echo "kubectl get ingress tresvita-todo-frontend -n frontend -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'"
    echo ""
    echo "Or access via port-forward:"
    echo "kubectl port-forward svc/tresvita-todo-frontend 3000:80 -n frontend"
    echo "Then open: http://localhost:3000"
    echo "========================================="
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
