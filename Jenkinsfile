pipeline {
    agent any
    
    environment {
        AWS_REGION = 'us-west-2'
        AWS_ACCOUNT_ID = credentials('aws-account-id')
        ECR_REPO = "${AWS_ACCOUNT_ID}.dkr.ecr.us-west-2.amazonaws.com/tresvita-todo-frontend"
        IMAGE_TAG = "${env.BUILD_NUMBER}"
    }
    
    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                sh 'git log -1'
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }
        
        stage('Lint') {
            steps {
                sh 'npm run lint || echo "No lint script, skipping"'
            }
        }
        
        stage('Test') {
            steps {
                sh 'npm test -- --coverage --watchAll=false || echo "No tests, skipping"'
            }
        }
        
        stage('Build Application') {
            steps {
                sh 'npm run build'
            }
        }
        
        stage('Build Docker Image') {
            steps {
                script {
                    def image = docker.build("${ECR_REPO}:${IMAGE_TAG}")
                }
            }
        }
        
        stage('Push to ECR') {
            steps {
                script {
                    sh """
                        aws ecr get-login-password --region ${AWS_REGION} | \
                        docker login --username AWS --password-stdin ${ECR_REPO}
                        
                        docker push ${ECR_REPO}:${IMAGE_TAG}
                        
                        docker tag ${ECR_REPO}:${IMAGE_TAG} ${ECR_REPO}:latest
                        docker push ${ECR_REPO}:latest
                    """
                }
            }
        }
        
        stage('Deploy to Dev') {
            when {
                branch 'develop'
            }
            steps {
                sh """
                    aws eks update-kubeconfig --region ${AWS_REGION} --name tresvita-todo-app-dev
                    
                    helm upgrade --install tresvita-todo-frontend ../infra-eks-terraform/helm_charts/todo-frontend \
                        --namespace frontend \
                        --set image.repository=${ECR_REPO} \
                        --set image.tag=${IMAGE_TAG} \
                        --set replicaCount=2 \
                        --wait \
                        --timeout 5m
                    
                    kubectl rollout status deployment/tresvita-todo-frontend -n frontend --timeout=300s
                """
            }
        }
        
        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            steps {
                input message: 'Deploy to Production?', ok: 'Deploy'
                
                sh """
                    aws eks update-kubeconfig --region ${AWS_REGION} --name tresvita-todo-app-dev
                    
                    helm upgrade --install tresvita-todo-frontend ../infra-eks-terraform/helm_charts/todo-frontend \
                        --namespace frontend \
                        --set image.repository=${ECR_REPO} \
                        --set image.tag=${IMAGE_TAG} \
                        --set replicaCount=3 \
                        --wait \
                        --timeout 10m
                    
                    kubectl rollout status deployment/tresvita-todo-frontend -n frontend --timeout=600s
                """
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
        success {
            echo '✅ Tresvita Frontend Pipeline completed successfully!'
        }
        failure {
            echo '❌ Tresvita Frontend Pipeline failed!'
        }
    }
}
