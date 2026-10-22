import { KanbanSquare, Vault } from "lucide-react";
import type * as React from "react";
import { Link } from "react-router";
import { NavUser } from "@/components/nav-user";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
} from "@/components/ui/sidebar";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	return (
		<Sidebar
			className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
			{...props}
		>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Tools</SidebarGroupLabel>
					<SidebarMenu>
						<SidebarMenuButton render={<Link to={"/"} />}>
							<KanbanSquare /> <span>Proof Dashboard</span>
						</SidebarMenuButton>
						<SidebarMenuButton render={<Link to={"/vault"} />}>
							<Vault />
							<span>Vault</span>
						</SidebarMenuButton>
					</SidebarMenu>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter>
				<NavUser />
			</SidebarFooter>
		</Sidebar>
	);
}
