interface StepIndicatorProps {
  steps: { title: string }[];
  current: number;
}

export default function StepIndicator({ steps, current }: StepIndicatorProps) {
  return (
    <div className="step-indicator">
      {steps.map((step, index) => {
        const isCompleted = index < current;
        const isCurrent = index === current;

        return (
          <div key={index} style={{ display: 'contents' }}>
            {index > 0 && (
              <div
                className={`step-line ${isCompleted ? 'step-line-completed' : 'step-line-pending'}`}
              />
            )}
            <div className="step-item">
              <div
                className={`step-circle ${
                  isCompleted
                    ? 'step-circle-completed'
                    : isCurrent
                      ? 'step-circle-current'
                      : 'step-circle-pending'
                }`}
              >
                {isCompleted ? '\u2713' : index + 1}
              </div>
              <div className={`step-label ${isCompleted || isCurrent ? 'step-label-active' : ''}`}>
                {step.title}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
