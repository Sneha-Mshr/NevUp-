import styles from "./EmptyState.module.css";

interface Props {
  message: string;
  action?: { label: string; onClick: () => void };
}

export default function EmptyState({ message, action }: Props) {
  return (
    <div className={styles.container}>
      <div className={styles.icon}>📭</div>
      <p className={styles.message}>{message}</p>
      {action && (
        <button className={styles.actionBtn} onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
}
