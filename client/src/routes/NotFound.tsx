import { AlertOctagon } from "lucide-react";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
export function NotFound() {
	return (
		<Empty>
			<EmptyHeader>
				<EmptyMedia variant={"icon"}>
					<AlertOctagon />
				</EmptyMedia>
				<EmptyTitle className="text-2xl">404 - Not Found</EmptyTitle>
				<EmptyDescription>
					The page you&apos;re looking for doesn&apos;t exist.
				</EmptyDescription>
			</EmptyHeader>
		</Empty>
	);
}
