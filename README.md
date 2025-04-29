<table>
<tr>
<td><h1>🛡️ AWS Serverless Disaster Recovery System</h1></td>
<td><img src="https://a0.awsstatic.com/libra-css/images/logos/aws_logo_smile_1200x630.png" alt="AWS Logo" width="75" style="margin-left: 15px;"/></td>
</tr>
</table>


**An automated, production-grade backup and recovery solution built on AWS serverless infrastructure**

[![AWS](https://img.shields.io/badge/AWS-%23FF9900.svg?logo=amazon-aws&logoColor=white)](https://aws.amazon.com)
[![Python](https://img.shields.io/badge/Python-3.12-blue.svg)](https://www.python.org/)
[![GitHub Last Commit](https://img.shields.io/github/last-commit/parth581/AWS-Serverless-Disaster-Recovery-System
)](https://github.com/parth581/AWS-Serverless-Disaster-Recovery-Pipeline)

## 📌 Key Features


- **Scheduled & On-Demand Backups**  
  EventBridge-triggered Lambda functions with manual override via API.

- **Military-Grade Encryption**  
  AES-256 server-side encryption for all backup objects.

- **Point-in-Time Recovery**  
  S3 versioning with cross-bucket restoration capability.

- **Infrastructure-as-Code**  
  AWS CDK/Terraform deployment templates (located in `/infra`).

- **Observability**  
  CloudWatch dashboards with custom metrics and SNS alerts.

---

## Tech Stack

### Core Services
- **Compute:** AWS Lambda (Python 3.12)
- **Storage:** S3 Standard + Intelligent-Tiering
- **Orchestration:** API Gateway REST API
- **Monitoring:** CloudWatch Logs/Metrics + AWS Config

### Key Patterns
- Idempotent backup operations
- Least-privilege IAM roles
- Immutable infrastructure deployment


## 🏗 Architecture

```mermaid
graph TD
    A[EventBridge Scheduler] --> B[Lambda]
    C[API Gateway] --> B
    B --> D[(S3 Backup Bucket)]
    B --> E[(S3 Recovery Bucket)]
    B --> F[CloudWatch]
    F --> G[SNS Alerts]

