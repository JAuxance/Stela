import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";

/** Checkbox task lists ("[ ] " shortcut). Not bundled in StarterKit. */
export function taskExtensions() {
  return [TaskList, TaskItem.configure({ nested: true })];
}
