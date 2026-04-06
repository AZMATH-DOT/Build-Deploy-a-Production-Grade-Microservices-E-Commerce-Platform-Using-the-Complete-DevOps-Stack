import React, { useState, useEffect, useRef } from "react";
import { 
  Server, 
  ShieldCheck, 
  Activity, 
  Cpu, 
  Database, 
  Globe, 
  MessageSquare, 
  Terminal, 
  Workflow, 
  GitBranch, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  Code2,
  Box,
  Layers,
  Cloud,
  Zap,
  Search,
  Send,
  Bot,
  User,
  Settings,
  Monitor
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GoogleGenAI } from "@google/genai";
import { cn } from "@/src/lib/utils";

// --- Types ---
interface Microservice {
  id: string;
  name: string;
  icon: React.ReactNode;
  status: "healthy" | "degraded" | "down";
  language: string;
  port: number;
  description: string;
  dockerfile: string;
}

interface LogEntry {
  id: string;
  timestamp: string;
  service: string;
  message: string;
  type: "info" | "warn" | "error" | "success";
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// --- Data ---
const SERVICES: Microservice[] = [
  { 
    id: "frontend", 
    name: "Frontend Web UI", 
    icon: <Globe className="w-5 h-5" />, 
    status: "healthy", 
    language: "Go", 
    port: 8080,
    description: "Go-based web UI & API gateway serving as the primary entry point.",
    dockerfile: "FROM golang:1.22-alpine AS builder\nWORKDIR /app\nRUN CGO_ENABLED=0 GOOS=linux go build -o main .\nFROM gcr.io/distroless/static-debian12\nCOPY --from=builder /app/main .\nENTRYPOINT [\"./main\"]"
  },
  { 
    id: "auth", 
    name: "Auth Service", 
    icon: <ShieldCheck className="w-5 h-5" />, 
    status: "healthy", 
    language: "Java", 
    port: 50051,
    description: "JWT-based authentication and user session management.",
    dockerfile: "FROM maven:3.9-eclipse-temurin-21 AS build\nCOPY . .\nRUN mvn clean package\nFROM eclipse-temurin:21-jre-alpine\nCOPY --from=build target/*.jar app.jar\nENTRYPOINT [\"java\", \"-jar\", \"app.jar\"]"
  },
  { 
    id: "product-catalog", 
    name: "Product Catalog", 
    icon: <Database className="w-5 h-5" />, 
    status: "healthy", 
    language: "Go", 
    port: 50051,
    description: "gRPC service managing product inventory and metadata.",
    dockerfile: "FROM golang:1.22-alpine\nWORKDIR /app\nCOPY . .\nRUN go build -o catalog .\nCMD [\"./catalog\"]"
  },
  { 
    id: "cart", 
    name: "Cart Service", 
    icon: <Box className="w-5 h-5" />, 
    status: "healthy", 
    language: "C#", 
    port: 50051,
    description: "High-performance cart management backed by Redis.",
    dockerfile: "FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build\nCOPY . .\nRUN dotnet publish -c Release -o out\nFROM mcr.microsoft.com/dotnet/aspnet:8.0\nCOPY --from=build out .\nENTRYPOINT [\"dotnet\", \"CartService.dll\"]"
  },
  { 
    id: "checkout", 
    name: "Checkout Service", 
    icon: <Workflow className="w-5 h-5" />, 
    status: "healthy", 
    language: "Node.js", 
    port: 8080,
    description: "Orchestrates complex order flows across 6 downstream services.",
    dockerfile: "FROM node:20-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm install --production\nCOPY . .\nCMD [\"node\", \"index.js\"]"
  },
  { 
    id: "ai-assistant", 
    name: "AI Assistant", 
    icon: <Bot className="w-5 h-5" />, 
    status: "healthy", 
    language: "Python", 
    port: 8080,
    description: "Gemini-powered shopping assistant with RAG capabilities.",
    dockerfile: "FROM python:3.11-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install -r requirements.txt\nCOPY . .\nCMD [\"python\", \"assistant.py\"]"
  },
  { 
    id: "recommendation", 
    name: "Recommendation Engine", 
    icon: <Zap className="w-5 h-5" />, 
    status: "healthy", 
    language: "Python", 
    port: 8080,
    description: "Real-time product suggestions based on user behavior.",
    dockerfile: "FROM python:3.11-slim\nWORKDIR /app\nCOPY . .\nRUN pip install -r requirements.txt\nCMD [\"python\", \"recommend.py\"]"
  }
];

// --- Components ---

const TerminalWindow = ({ logs }: { logs: LogEntry[] }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-slate-950 rounded-lg border border-slate-800 flex flex-col h-full overflow-hidden shadow-2xl">
      <div className="bg-slate-900 px-4 py-2 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Live Cluster Logs</span>
        </div>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50" />
        </div>
      </div>
      <div 
        ref={scrollRef}
        className="p-4 font-mono text-[13px] overflow-y-auto flex-1 space-y-1 scrollbar-thin scrollbar-thumb-slate-800"
      >
        {logs.map((log) => (
          <div key={log.id} className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
            <span className="text-slate-600 shrink-0">[{log.timestamp}]</span>
            <span className={cn(
              "font-bold shrink-0 w-24",
              log.type === "info" && "text-blue-400",
              log.type === "warn" && "text-yellow-400",
              log.type === "error" && "text-red-400",
              log.type === "success" && "text-green-400"
            )}>{log.service.toUpperCase()}</span>
            <span className="text-slate-300">{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const ServiceCard = ({ service, isSelected, onClick }: { service: Microservice, isSelected: boolean, onClick: () => void, key?: string }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden group",
        isSelected 
          ? "bg-blue-500/10 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.15)]" 
          : "bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn(
          "p-2.5 rounded-lg",
          isSelected ? "bg-blue-500 text-white" : "bg-slate-800 text-slate-400 group-hover:text-slate-200"
        )}>
          {service.icon}
        </div>
        <div className="flex items-center gap-1.5">
          <div className={cn(
            "w-2 h-2 rounded-full animate-pulse",
            service.status === "healthy" ? "bg-green-500" : "bg-red-500"
          )} />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
            {service.status}
          </span>
        </div>
      </div>
      <h3 className="font-semibold text-slate-100 text-sm mb-1">{service.name}</h3>
      <div className="flex items-center gap-2">
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
          {service.language}
        </span>
        <span className="text-[10px] text-slate-500 font-mono">
          Port: {service.port}
        </span>
      </div>
      
      {isSelected && (
        <motion.div 
          layoutId="active-indicator"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
        />
      )}
    </motion.div>
  );
};

export default function App() {
  const [selectedService, setSelectedService] = useState<Microservice | null>(SERVICES[0]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hello! I am the Quantum Vector AI Assistant. How can I help you with the microservices platform today?" }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState<"architecture" | "cicd" | "observability">("architecture");

  // --- Simulation Logic ---
  useEffect(() => {
    const interval = setInterval(() => {
      const randomService = SERVICES[Math.floor(Math.random() * SERVICES.length)];
      const messages = [
        "Incoming gRPC request handled successfully",
        "Health check passed",
        "Cache hit for product_id: " + Math.floor(Math.random() * 1000),
        "Processing transaction...",
        "Metrics scraped by Prometheus",
        "New deployment detected by ArgoCD"
      ];
      const types: LogEntry["type"][] = ["info", "success", "info", "info", "success", "warn"];
      const index = Math.floor(Math.random() * messages.length);
      
      const newLog: LogEntry = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        service: randomService.id,
        message: messages[index],
        type: types[index]
      };

      setLogs(prev => [...prev.slice(-49), newLog]);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMsg: ChatMessage = { role: "user", content: inputMessage };
    setChatMessages(prev => [...prev, userMsg]);
    setInputMessage("");
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const model = "gemini-3-flash-preview";
      
      const systemInstruction = `
        You are the Quantum Vector AI Assistant, a Senior DevOps and Platform Engineer.
        You are an expert on the 13-microservice e-commerce platform architecture.
        The platform uses: Go, Python, Node.js, Java, gRPC, Redis, PostgreSQL, AWS EKS, Jenkins, ArgoCD, Helm, Prometheus, and Grafana.
        Be concise, technical, and helpful.
      `;

      const response = await ai.models.generateContent({
        model,
        contents: [
          { role: "user", parts: [{ text: inputMessage }] }
        ],
        config: {
          systemInstruction
        }
      });

      const assistantMsg: ChatMessage = { role: "assistant", content: response.text || "I'm sorry, I couldn't process that." };
      setChatMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error("AI Error:", error);
      setChatMessages(prev => [...prev, { role: "assistant", content: "Error connecting to Gemini API. Please check your configuration." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
      {/* --- Header --- */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Cpu className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight text-white">Quantum Vector</h1>
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Production-Grade Platform</p>
            </div>
          </div>

          <nav className="flex items-center gap-1 bg-slate-900/50 p-1 rounded-lg border border-slate-800">
            {[
              { id: "architecture", icon: <Layers className="w-4 h-4" />, label: "Architecture" },
              { id: "cicd", icon: <GitBranch className="w-4 h-4" />, label: "CI/CD & GitOps" },
              { id: "observability", icon: <Activity className="w-4 h-4" />, label: "Observability" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-medium transition-all",
                  activeTab === tab.id 
                    ? "bg-slate-800 text-white shadow-sm" 
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-bold text-green-500 uppercase">Cluster: Healthy</span>
            </div>
            <button className="p-2 text-slate-400 hover:text-white transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-6 grid grid-cols-12 gap-6 h-[calc(100vh-64px)]">
        
        {/* --- Left Column: Service Grid & Details --- */}
        <div className="col-span-8 flex flex-col gap-6 overflow-hidden">
          
          {activeTab === "architecture" && (
            <>
              <div className="grid grid-cols-4 gap-4">
                {SERVICES.map((service) => (
                  <ServiceCard 
                    key={service.id} 
                    service={service} 
                    isSelected={selectedService?.id === service.id}
                    onClick={() => setSelectedService(service)}
                  />
                ))}
                <div className="p-4 rounded-xl border border-dashed border-slate-800 flex flex-col items-center justify-center gap-2 text-slate-600 hover:text-slate-400 hover:border-slate-700 transition-all cursor-pointer group">
                  <div className="w-10 h-10 rounded-full border border-dashed border-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Box className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest">+ 6 More Services</span>
                </div>
              </div>

              <div className="flex-1 min-h-0 grid grid-cols-2 gap-6">
                {/* Service Details */}
                <div className="bg-slate-900/50 rounded-2xl border border-slate-800 flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/30">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
                        {selectedService?.icon}
                      </div>
                      <h2 className="font-bold text-white">{selectedService?.name}</h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-500">ID: {selectedService?.id}</span>
                    </div>
                  </div>
                  <div className="p-6 overflow-y-auto space-y-6">
                    <div>
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Description</h3>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {selectedService?.description}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Language</span>
                        <span className="text-sm font-semibold text-white">{selectedService?.language}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Port Mapping</span>
                        <span className="text-sm font-semibold text-white">{selectedService?.port} → 8080</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Dockerfile (Multi-stage)</h3>
                        <button className="text-[10px] text-blue-400 hover:text-blue-300 font-bold uppercase">Copy Code</button>
                      </div>
                      <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 font-mono text-xs text-slate-400 leading-relaxed">
                        <pre className="whitespace-pre-wrap">{selectedService?.dockerfile}</pre>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Logs */}
                <TerminalWindow logs={logs} />
              </div>
            </>
          )}

          {activeTab === "cicd" && (
            <div className="flex-1 bg-slate-900/50 rounded-2xl border border-slate-800 p-8 overflow-y-auto">
              <div className="max-w-3xl mx-auto space-y-12">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">CI/CD & GitOps Pipeline</h2>
                    <p className="text-slate-400 text-sm">Automated build, test, and deployment workflow using Jenkins and ArgoCD.</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-500">142</div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Builds Today</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-500">99.2%</div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Success Rate</div>
                    </div>
                  </div>
                </div>

                {/* Pipeline Visualization */}
                <div className="relative flex items-center justify-between py-12">
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-800 -translate-y-1/2 z-0" />
                  
                  {[
                    { icon: <GitBranch />, label: "Git Push", status: "success" },
                    { icon: <Workflow />, label: "Jenkins Build", status: "success" },
                    { icon: <ShieldCheck />, label: "SonarQube", status: "success" },
                    { icon: <Cloud />, label: "ECR Push", status: "success" },
                    { icon: <Zap />, label: "ArgoCD Sync", status: "active" }
                  ].map((step, i) => (
                    <div key={i} className="relative z-10 flex flex-col items-center gap-3">
                      <div className={cn(
                        "w-14 h-14 rounded-full flex items-center justify-center border-4 border-slate-950",
                        step.status === "success" ? "bg-green-500 text-white" : "bg-blue-600 text-white animate-pulse"
                      )}>
                        {step.icon}
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{step.label}</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <CheckCircle2 className="text-green-500 w-5 h-5" />
                      <h3 className="font-bold text-white">ArgoCD Status</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Sync Status</span>
                        <span className="text-green-400 font-bold">Synced</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Health Status</span>
                        <span className="text-green-400 font-bold">Healthy</span>
                      </div>
                      <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 w-full" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <AlertCircle className="text-blue-500 w-5 h-5" />
                      <h3 className="font-bold text-white">Recent Deployments</h3>
                    </div>
                    <div className="space-y-3">
                      {["cart-service:v2.4.1", "auth-service:v1.9.0", "frontend:v3.0.2"].map((dep, i) => (
                        <div key={i} className="flex items-center justify-between text-xs p-2 rounded bg-slate-900/50 border border-slate-800">
                          <span className="text-slate-300 font-mono">{dep}</span>
                          <span className="text-slate-500">2m ago</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "observability" && (
            <div className="flex-1 bg-slate-900/50 rounded-2xl border border-slate-800 p-8 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Cluster Observability</h2>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 bg-slate-800 rounded-lg text-xs font-bold text-slate-300 hover:text-white transition-colors">Last 1 Hour</button>
                  <button className="px-3 py-1.5 bg-blue-600 rounded-lg text-xs font-bold text-white">Real-time</button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                {[
                  { label: "CPU Usage", value: "42%", color: "text-blue-500", icon: <Cpu /> },
                  { label: "Memory Usage", value: "68%", color: "text-purple-500", icon: <Layers /> },
                  { label: "Network I/O", value: "1.2 GB/s", color: "text-green-500", icon: <Activity /> }
                ].map((stat, i) => (
                  <div key={i} className="bg-slate-950 rounded-2xl border border-slate-800 p-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="p-2 bg-slate-900 rounded-lg text-slate-400">
                        {stat.icon}
                      </div>
                      <span className={cn("text-2xl font-bold", stat.color)}>{stat.value}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.label}</span>
                    <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: stat.value }}
                        className={cn("h-full", stat.color.replace("text-", "bg-"))} 
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex-1 bg-slate-950 rounded-2xl border border-slate-800 p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white">Distributed Tracing (OpenTelemetry)</h3>
                  <span className="text-[10px] text-slate-500 font-mono">Active Spans: 1,240</span>
                </div>
                <div className="flex-1 flex flex-col gap-3">
                  {[
                    { path: "GET /api/v1/products", latency: "42ms", status: 200 },
                    { path: "POST /api/v1/cart/add", latency: "128ms", status: 200 },
                    { path: "GET /api/v1/recommendations", latency: "310ms", status: 200 },
                    { path: "POST /api/v1/checkout", latency: "840ms", status: 200 },
                    { path: "GET /api/v1/auth/verify", latency: "12ms", status: 200 }
                  ].map((trace, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-slate-900/30 border border-slate-800/50 group hover:border-slate-700 transition-all">
                      <div className="w-12 text-center">
                        <span className="text-[10px] font-bold text-green-500">{trace.status}</span>
                      </div>
                      <div className="flex-1">
                        <span className="text-xs font-mono text-slate-300">{trace.path}</span>
                      </div>
                      <div className="w-24 text-right">
                        <span className="text-xs font-bold text-slate-500">{trace.latency}</span>
                      </div>
                      <div className="w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500/50" style={{ width: `${Math.random() * 60 + 20}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* --- Right Column: AI Assistant Chat --- */}
        <div className="col-span-4 flex flex-col bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-slate-800 bg-slate-900/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <Bot className="text-white w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-sm text-white">AI Platform Assistant</h2>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Gemini 3 Flash</span>
                </div>
              </div>
            </div>
            <button className="text-slate-500 hover:text-white transition-colors">
              <Monitor className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
            {chatMessages.map((msg, i) => (
              <div key={i} className={cn(
                "flex gap-3 max-w-[85%]",
                msg.role === "user" ? "ml-auto flex-row-reverse" : ""
              )}>
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                  msg.role === "assistant" ? "bg-blue-600/20 text-blue-400" : "bg-slate-800 text-slate-400"
                )}>
                  {msg.role === "assistant" ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>
                <div className={cn(
                  "p-3 rounded-2xl text-sm leading-relaxed",
                  msg.role === "assistant" 
                    ? "bg-slate-800 text-slate-200 rounded-tl-none" 
                    : "bg-blue-600 text-white rounded-tr-none"
                )}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-slate-800 p-3 rounded-2xl rounded-tl-none flex gap-1 items-center">
                  <div className="w-1 h-1 bg-slate-500 rounded-full animate-bounce" />
                  <div className="w-1 h-1 bg-slate-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1 h-1 bg-slate-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-800 bg-slate-900/30">
            <div className="relative">
              <input 
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Ask about the architecture..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-600"
              />
              <button 
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isTyping}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-500 hover:text-blue-400 disabled:text-slate-700 transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-[10px] text-slate-600 mt-3 text-center">
              Powered by Quantum Vector AI Engine • v2.5.0
            </p>
          </div>
        </div>

      </main>

      {/* --- Footer Status Bar --- */}
      <footer className="h-8 border-t border-slate-800 bg-slate-950 flex items-center px-6 justify-between text-[10px] font-mono text-slate-500">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="uppercase font-bold">Region:</span>
            <span className="text-slate-300">us-east-1 (N. Virginia)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="uppercase font-bold">K8s Version:</span>
            <span className="text-slate-300">v1.29.1-eks</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="uppercase font-bold">GitOps:</span>
            <span className="text-green-500">Auto-Sync Enabled</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span>API Gateway: Online</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span>Redis Cluster: Connected</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
