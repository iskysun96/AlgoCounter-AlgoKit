import beaker
import pyteal as pt

class CounterState:
    counter = beaker.GlobalStateValue(
        stack_type=pt.TealType.uint64,
        default=pt.Int(0),
        descr="Counter",
    )

    last_caller_address = beaker.GlobalStateValue(
        stack_type=pt.TealType.bytes,
        default=pt.Global.creator_address(),
        descr="Last caller address",
    )


app = (
    beaker.Application("Counter", state=CounterState)
    .apply(beaker.unconditional_create_approval, initialize_global_state=True)
)


@app.external
def increment(*, output: pt.abi.Uint64) -> pt.Expr:
    return pt.Seq(
        # Increment the counter
        app.state.counter.set(app.state.counter + pt.Int(1)),
        # Save caller address
        app.state.last_caller_address.set(pt.Txn.sender()),
        output.set(app.state.counter),
    )
