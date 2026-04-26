import styles from "./LoadingSkeleton.module.css";

export default function LoadingSkeleton() {
  return (
    <div className={styles.container} role="status" aria-label="Loading content">
      <div className={`skeleton ${styles.bar} ${styles.wide}`} />
      <div className={styles.row}>
        <div className={`skeleton ${styles.card}`} />
        <div className={`skeleton ${styles.card}`} />
      </div>
      <div className={`skeleton ${styles.bar}`} />
      <div className={`skeleton ${styles.block}`} />
      <span className={styles.srOnly}>Loading...</span>
    </div>
  );
}
