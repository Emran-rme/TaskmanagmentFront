import { useEffect, useRef, useState, type ReactNode } from "react";
import { useProjectCoverQuery } from "../store";
import type { Project } from "../lib/types";

export default function ProjectCover({
  project,
  children,
}: {
  project: Project;
  children: ReactNode;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!container.current) return;
    if (!("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "150px" },
    );
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  const { data } = useProjectCoverQuery(project.id, {
    skip: !visible || !project.hasCoverImage,
  });
  const source = data?.coverImage || project.coverImage;
  return (
    <div ref={container}>
      {source ? (
        <img
          src={source}
          alt={project.name}
          loading="lazy"
          decoding="async"
          className="h-36 w-full object-cover"
        />
      ) : (
        children
      )}
    </div>
  );
}
