import { useEffect, useState } from 'react'
import Select, {
	components,
	type DropdownIndicatorProps,
	type ValueContainerProps,
} from 'react-select'
import styles from './searchableSelect.module.scss'

interface NeighborhoodOption {
	value: number
	label: string
}

const LeftIcon = () => (
	<svg
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		className={styles.leftIcon}
	>
		<path
			d="M3 21H21M19 21V17M19 17C19.5304 17 20.0391 16.7893 20.4142 16.4142C20.7893 16.0391 21 15.5304 21 15V13C21 12.4696 20.7893 11.9609 20.4142 11.5858C20.0391 11.2107 19.5304 11 19 11C18.4696 11 17.9609 11.2107 17.5858 11.5858C17.2107 11.9609 17 12.4696 17 13V15C17 15.5304 17.2107 16.0391 17.5858 16.4142C17.9609 16.7893 18.4696 17 19 17ZM14 21V7C14 6.20435 13.6839 5.44129 13.1213 4.87868C12.5587 4.31607 11.7956 4 11 4H7C6.20435 4 5.44129 4.31607 4.87868 4.87868C4.31607 5.44129 4 6.20435 4 7V21M9 17V21M8 13H10M8 9H10"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
)

const DropdownIcon = () => (
	<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
		<path
			d="M6 9L12 15L18 9"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
)

const CustomValueContainer = ({
	children,
	...props
}: ValueContainerProps<NeighborhoodOption, false>) => (
	<components.ValueContainer {...props}>
		<LeftIcon />
		{children}
	</components.ValueContainer>
)

const CustomDropdownIndicator = (props: DropdownIndicatorProps<NeighborhoodOption, false>) => (
	<components.DropdownIndicator {...props}>
		<DropdownIcon />
	</components.DropdownIndicator>
)

export default function SearchableSelect({ onChange }: { onChange: (id: number) => void }) {
	const [options, setOptions] = useState<NeighborhoodOption[]>([])
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		fetch('http://localhost:5000/api/neighborhoods')
			.then((res) => res.json())
			.then((data) => {
				setOptions(data.map((n: any) => ({ value: n.id, label: n.name })))
				setIsLoading(false)
			})
			.catch(() => setIsLoading(false))
	}, [])

	return (
		<div className={styles.selectWrapper}>
			<Select
				instanceId="neighborhood-select"
				classNamePrefix="react-select"
				options={options}
				isLoading={isLoading}
				components={{
					DropdownIndicator: CustomDropdownIndicator,
					IndicatorSeparator: () => null,
					ValueContainer: CustomValueContainer,
				}}
				placeholder="Osiedle"
				noOptionsMessage={() => 'Nie znaleziono osiedla'}
				onChange={(val) => val && onChange(val.value)}
			/>
		</div>
	)
}
