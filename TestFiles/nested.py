def outer():
    def inner():
        return "Inner"
    return inner()
