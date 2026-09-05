import React, { useState } from 'react';
import { Server, Database, Cloud, Network, Shield, Cpu, Activity, ArrowRight, Layers, Lock, FileCode } from 'lucide-react';

export default function ArchitectureView() {
  const [selectedNode, setSelectedNode] = useState('alb');

  const nodes = {
    vpc: {
      title: 'Amazon VPC & Subnets',
      category: 'Networking',
      icon: Network,
      color: 'from-blue-600 to-cyan-500',
      whyRequired: 'Isolates resources in a dedicated virtual network. Divides infrastructure across two Availability Zones (AZs) into Public Subnets (for ALB/NAT) and Private Subnets (for ECS tasks and RDS database) to prevent direct internet exposure.',
      trafficFlow: 'Internet HTTP/HTTPS requests enter the VPC via the Internet Gateway (IGW) and target the Public ALB. Backend ECS containers in Private Subnets reach external endpoints (like S3 or updates) via NAT Gateways.'
    },
    alb: {
      title: 'Application Load Balancer (ALB)',
      category: 'Traffic Routing',
      icon: Server,
      color: 'from-indigo-600 to-blue-500',
      whyRequired: 'Distributes incoming HTTP requests evenly across multiple FastAPI containers in private subnets. Performs continuous Health Checks (`GET /health`), handles SSL termination, and prevents DDoS overloading.',
      trafficFlow: 'Receives user traffic on port 80/443, evaluates listener rules, and routes valid API calls to healthy ECS Fargate tasks on port 8000 across Availability Zones.'
    },
    ecs: {
      title: 'AWS ECS Fargate',
      category: 'Compute Service',
      icon: Cpu,
      color: 'from-purple-600 to-indigo-500',
      whyRequired: 'Serverless container orchestration that runs FastAPI Python applications without managing EC2 instances. Scales automatically based on CPU/Memory load and ensures high availability.',
      trafficFlow: 'Executes FastAPI worker containers. Receives requests from ALB, queries RDS PostgreSQL for employee records, uploads photo objects to S3, and sends async event payloads to SQS.'
    },
    rds: {
      title: 'Amazon RDS PostgreSQL',
      category: 'Database Tier',
      icon: Database,
      color: 'from-emerald-600 to-teal-500',
      whyRequired: 'Managed relational database located strictly in Private DB Subnets. Handles ACID transactions for employee records, automated backups, multi-AZ failover, and encryption at rest.',
      trafficFlow: 'Accepts PostgreSQL SQL connections on port 5432 strictly from ECS Fargate tasks (enforced by Security Group rules). Rejects all incoming traffic from external internet.'
    },
    s3: {
      title: 'Amazon S3 Bucket',
      category: 'Object Storage',
      icon: Cloud,
      color: 'from-amber-600 to-orange-500',
      whyRequired: 'Scalable cloud object storage for storing employee avatar images (`/photos/`). Offloads file storage from compute instances so containers remain stateless.',
      trafficFlow: 'FastAPI backend uploads photo binary streams via Boto3 AWS SDK or generates Presigned URLs. Client browsers load uploaded images directly from S3 bucket endpoints.'
    },
    sqs: {
      title: 'Amazon SQS Queue',
      category: 'Asynchronous Queueing',
      icon: Activity,
      color: 'from-pink-600 to-rose-500',
      whyRequired: 'Decouples heavy photo thumbnailing, audit logging, and notification tasks from synchronous HTTP request/response loops, ensuring lightning-fast API responses.',
      trafficFlow: 'FastAPI sends JSON event messages (`PROCESS_EMPLOYEE_PHOTO`) to SQS upon photo upload. Background worker tasks poll SQS, process images asynchronously, and update status.'
    },
    secrets: {
      title: 'AWS Secrets Manager & IAM',
      category: 'Security & Auth',
      icon: Lock,
      color: 'from-red-600 to-amber-600',
      whyRequired: 'Stores database credentials, secret keys, and TLS certs securely. IAM Roles follow Least Privilege principles to grant ECS tasks access to S3/SQS without hardcoding keys.',
      trafficFlow: 'ECS Fargate tasks retrieve database connection credentials dynamically at startup via IAM Task Execution Role.'
    }
  };

  const active = nodes[selectedNode];

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold rounded-full">
              AWS Production Architecture
            </span>
            <span className="text-slate-500 text-xs">• 2 Availability Zones</span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1">AWS Cloud Infrastructure & Traffic Flow</h2>
          <p className="text-xs text-slate-400">Click any service component to inspect its necessity, security boundary, and data flow.</p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-slate-900 px-3 py-2 rounded-xl border border-slate-800 text-slate-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
          VPC: 10.0.0.0/16
        </div>
      </div>

      {/* Interactive Topology Diagram */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Component Selector Grid */}
        <div className="lg:col-span-1 space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">Architecture Components</p>
          {Object.entries(nodes).map(([key, item]) => {
            const Icon = item.icon;
            const isSelected = selectedNode === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedNode(key)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-slate-900 border-blue-500/60 shadow-lg shadow-blue-500/10'
                    : 'glass-card border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-lg bg-gradient-to-tr ${item.color} flex items-center justify-center text-white`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${isSelected ? 'text-blue-400' : 'text-white'}`}>{item.title}</p>
                    <p className="text-[11px] text-slate-400">{item.category}</p>
                  </div>
                </div>
                <ArrowRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-blue-400 translate-x-1' : 'text-slate-600'}`} />
              </button>
            );
          })}
        </div>

        {/* Selected Component Inspector Card */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-800 space-y-6">
          
          <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
            <div className={`h-12 w-12 rounded-xl bg-gradient-to-tr ${active.color} flex items-center justify-center text-white shadow-lg`}>
              <active.icon className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-blue-400 uppercase">{active.category}</span>
              <h3 className="text-lg font-bold text-white">{active.title}</h3>
            </div>
          </div>

          <div className="space-y-4">
            
            {/* Why Required Box */}
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                <Shield className="w-4 h-4" />
                <span>Why is this AWS service required?</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{active.whyRequired}</p>
            </div>

            {/* Traffic Flow Box */}
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
                <Activity className="w-4 h-4" />
                <span>Traffic & Data Flow</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{active.trafficFlow}</p>
            </div>

          </div>

          {/* Infrastructure Flow Diagram Visualizer */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 font-mono text-[11px] text-slate-400 space-y-2">
            <div className="flex items-center justify-between text-slate-300 border-b border-slate-800 pb-2">
              <span className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                AWS Network Routing Sequence
              </span>
              <span className="text-emerald-400">Active Topology</span>
            </div>
            <div className="space-y-1 pt-2">
              <p className="text-slate-300">1. Client Request → [Internet Gateway] → Public Subnet (ALB:80/443)</p>
              <p className="text-slate-400">2. ALB Listener Rule → [Target Group] → Private App Subnet (ECS Fargate:8000)</p>
              <p className="text-slate-400">3. ECS FastAPI Task → [Security Group 5432] → Private DB Subnet (Amazon RDS)</p>
              <p className="text-slate-400">4. ECS Upload Event → [AWS IAM Role] → Amazon S3 Bucket & SQS Queue</p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
