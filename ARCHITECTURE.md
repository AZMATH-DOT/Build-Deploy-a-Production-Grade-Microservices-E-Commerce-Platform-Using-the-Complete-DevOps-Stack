# 🏗️ Quantum Vector: Production-Grade Microservices Architecture

This document outlines the architecture for the 13-service microservices e-commerce platform.

## 🗺️ System Overview

The platform is designed for high availability, scalability, and security, running on **AWS EKS** (Elastic Kubernetes Service).

### 📡 Service Communication Map

1.  **Frontend (Go)**: Entry point for users. Serves the web UI and acts as an API Gateway.
2.  **Auth Service**: Handles JWT-based authentication and user management.
3.  **Product Catalog**: gRPC-based service providing product listings.
4.  **Cart Service (Redis)**: High-performance per-user shopping cart storage.
5.  **Checkout Service (Node.js)**: Orchestrates the order flow across multiple services.
6.  **Payment Service**: Validates cards and processes transactions.
7.  **Shipping Service**: Calculates shipping quotes and generates tracking IDs.
8.  **Email Service**: Sends order confirmations via Jinja2 templates.
9.  **Recommendation Engine**: AI-driven product suggestions.
10. **AI Assistant (Gemini + LangChain)**: Context-aware shopping assistant using RAG.
11. **Currency Service**: Real-time exchange rate conversions.
12. **Ads Service**: Contextual advertising based on user browsing.
13. **Load Generator**: Locust-based traffic simulator for stress testing.

## 🛠️ DevOps Stack

*   **Infrastructure**: AWS EKS, VPC, IAM, Secrets Manager.
*   **Provisioning**: `eksctl` / Terraform.
*   **CI/CD**: Jenkins on EC2 (Pipeline-as-Code).
*   **GitOps**: ArgoCD (Auto-sync, Self-heal).
*   **Containerization**: Docker (Multi-stage, Distroless).
*   **Orchestration**: Kubernetes (Helm, Kustomize, HPA).
*   **Observability**: Prometheus, Grafana, OpenTelemetry.

## 🔐 Security (IRSA)

IAM Roles for Service Accounts (IRSA) allows Kubernetes pods to assume IAM roles to securely access AWS resources like Secrets Manager without hardcoded credentials.

## 🚀 Deployment Flow

1.  **Push**: Developer pushes code to GitHub.
2.  **Build**: Jenkins detects push, builds Docker image, runs SonarQube scan.
3.  **Push Registry**: Jenkins pushes image to Amazon ECR.
4.  **Update Manifest**: Jenkins updates the image tag in the Helm chart/Git repo.
5.  **Sync**: ArgoCD detects manifest change and syncs the cluster state.
6.  **Verify**: Prometheus/Grafana monitors the rollout.
