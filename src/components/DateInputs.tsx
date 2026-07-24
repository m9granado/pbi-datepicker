import * as React from "react";
import { toISOInput } from "../utils/dateHelpers";
import trashIcon from "../../assets/datex-trash.svg";

export interface DateInputsProps {
  from?: Date;
  to?: Date;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  onFromChange: (date?: Date) => void;
  onToChange: (date?: Date) => void;
  onClear: () => void;
}

const styles: { [key: string]: React.CSSProperties } = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column' as const,
    marginBottom: '0.5em'
  },
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25em',
    flexWrap: 'wrap'
  },
  input: {
    width: '7.5em',
    height: '2.2em',
    padding: '0 0.5em',
    border: '1px solid #D1D1D6',
    borderRadius: '2px',
    background: '#FFFFFF',
    color: 'inherit',
    fontFamily: 'inherit',
    fontSize: '0.85em',
    fontWeight: 400,
    transition: 'all 0.2s ease'
  },
  inputError: {
    border: '2px solid #FF3B30',
    background: '#FFF5F5'
  },
  inputDisabled: {
    background: '#F5F5F7',
    color: '#8E8E93',
    cursor: 'not-allowed'
  },
  iconButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '2.2em',
    height: '2.2em',
    border: '1px solid #D1D1D6',
    borderRadius: '2px',
    background: '#FFFFFF',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  icon: {
    display: 'inline-block',
    width: '1em',
    height: '1em',
    backgroundColor: 'currentColor',
    WebkitMaskImage: `url(${trashIcon})`,
    maskImage: `url(${trashIcon})`,
    WebkitMaskSize: 'contain',
    maskSize: 'contain',
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center',
    maskPosition: 'center'
  },
  errorMessage: {
    fontSize: '0.75em',
    color: '#FF3B30',
    marginTop: '0.25em',
    marginLeft: '0.25em',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25em'
  },
  swappingMessage: {
    fontSize: '0.75em',
    color: '#007AFF',
    marginTop: '0.25em',
    marginLeft: '0.25em',
    fontStyle: 'italic'
  }
};

export const DateInputs: React.FC<DateInputsProps> = ({
  from,
  to,
  minDate,
  maxDate,
  disabled = false,
  onFromChange,
  onToChange,
  onClear
}) => {
  const [error, setError] = React.useState<string | null>(null);
  const [isSwapping, setIsSwapping] = React.useState(false);
  const [localFrom, setLocalFrom] = React.useState(from);
  const [localTo, setLocalTo] = React.useState(to);

  // Update local state when props change
  React.useEffect(() => {
    setLocalFrom(from);
    setLocalTo(to);
  }, [from, to]);

  const validateAndUpdate = (
    newFrom: Date | undefined, 
    newTo: Date | undefined,
    isFromInput: boolean
  ) => {
    // Check for invalid date range (from > to)
    if (newFrom && newTo && newFrom > newTo) {
      setError("La fecha inicial debe ser anterior a la fecha final");
      
      // Show swapping animation
      setIsSwapping(true);
      
      // Auto-swap after 800ms to give user time to see the error
      setTimeout(() => {
        setError(null);
        setIsSwapping(false);
        onFromChange(newTo);
        onToChange(newFrom);
      }, 800);
      
      return;
    }

    // Clear any existing error
    setError(null);
    setIsSwapping(false);
    
    // Apply changes
    if (isFromInput) {
      onFromChange(newFrom);
    } else {
      onToChange(newTo);
    }
  };

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    const d = v ? new Date(v + "T00:00:00") : undefined;
    setLocalFrom(d);
    validateAndUpdate(d, localTo, true);
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    const d = v ? new Date(v + "T00:00:00") : undefined;
    setLocalTo(d);
    validateAndUpdate(localFrom, d, false);
  };

  const getInputStyle = (isFrom: boolean) => {
    let style = { ...styles.input };
    
    if (disabled) {
      style = { ...style, ...styles.inputDisabled };
    }
    
    if (error) {
      style = { ...style, ...styles.inputError };
    }
    
    return style;
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <input
          type="date"
          value={toISOInput(localFrom)}
          min={toISOInput(minDate)}
          max={toISOInput(maxDate)}
          onChange={handleFromChange}
          style={getInputStyle(true)}
          disabled={disabled}
          aria-label="Fecha inicial"
          title="Fecha inicial"
          aria-invalid={!!error}
        />
        <span>—</span>
        <input
          type="date"
          value={toISOInput(localTo)}
          min={toISOInput(minDate)}
          max={toISOInput(maxDate)}
          onChange={handleToChange}
          style={getInputStyle(false)}
          disabled={disabled}
          aria-label="Fecha final"
          title="Fecha final"
          aria-invalid={!!error}
        />
        <button
          title="Limpiar filtro"
          type="button"
          onClick={onClear}
          style={styles.iconButton}
          aria-label="Limpiar filtro"
        >
          <span style={styles.icon} />
        </button>
      </div>
      
      {error && !isSwapping && (
        <div style={styles.errorMessage} role="alert">
          <span>⚠️</span>
          {error}
        </div>
      )}
      
      {isSwapping && (
        <div style={styles.swappingMessage}>
          <span>🔄</span> Auto-ajustando fechas...
        </div>
      )}
    </div>
  );
};
