import React from "react";
import ReactDOM from "react-dom/client";
import ProofDashboard from "./routes/ProofDashboard";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router";
import { Toaster } from "@/components/ui/toast.tsx";
import { TooltipProvider } from "./components/ui/tooltip";
import { UserProvider } from "./hooks/use-user";
import Dashboard from "./routes/Layout";
import { NotFound } from "./routes/NotFound";
import { Vault } from "./routes/Vault";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<QueryClientProvider client={queryClient}>
			<UserProvider>
				<TooltipProvider>
					<BrowserRouter>
						<Routes>
							<Route element={<Dashboard />}>
								<Route path="/" element={<ProofDashboard />} />
								<Route path="/vault" element={<Vault />}></Route>
								<Route path="*" element={<NotFound />} />
							</Route>
						</Routes>
					</BrowserRouter>
					<Toaster />
				</TooltipProvider>
			</UserProvider>
		</QueryClientProvider>
	</React.StrictMode>,
);
