import { Construction } from "lucide-react";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";

export function Vault() {
	return (
		<Empty>
			<EmptyHeader>
				<EmptyMedia variant={"icon"}>
					<Construction />
				</EmptyMedia>
				<EmptyTitle className="text-2xl">Under Construction</EmptyTitle>
				<EmptyDescription>This page is under construction</EmptyDescription>
			</EmptyHeader>
		</Empty>
	);
}
