// @flow
import * as React from 'react';
import classNames from 'classnames';
import './RadioGroup.scss';

type Props = {
    children: React.Node,
    className: string,
    isHorizontal: boolean,
    name?: string,
    onChange?: Function,
    value?: string,
};

type State = {
    value?: string,
};

class RadioGroup extends React.Component<Props, State> {
    static defaultProps = {
        className: '',
        isHorizontal: false,
    };

    constructor(props: Props) {
        super(props);
        this.state = {
            value: props.value,
        };
    }

    onChangeHandler = (event: SyntheticEvent<>) => {
        const { target } = event;
        const { onChange } = this.props;

        if (target instanceof HTMLInputElement) {
            this.setState({
                value: target.value,
            });
        }

        if (onChange) {
            onChange(event);
        }
    };

    render() {
        const { children, className, isHorizontal, name } = this.props;
        const { value } = this.state;
        const classes = classNames(
            'radio-group',
            {
                'bdl-RadioGroup--horizontal': isHorizontal,
            },
            className,
        );

        return (
            <div className={classes} onChange={this.onChangeHandler}>
                {React.Children.map(children, radio =>
                    React.cloneElement(radio, {
                        description: isHorizontal ? '' : radio.props.description,
                        hideLabel: isHorizontal ? true : radio.props.hideLabel,
                        isSelected: radio.props.value === value,
                        name,
                    }),
                )}
            </div>
        );
    }
}

export type RadioGroupProps = Props;
export default RadioGroup;
