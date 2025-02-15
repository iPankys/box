import { assert, test } from "@hazae41/phobos"
import "@hazae41/symbol-dispose-polyfill"
import { Box } from "./box.js"

class A<T extends Disposable> {

  constructor(
    readonly inner: Box<T>
  ) { }

  [Symbol.dispose]() {
    this.inner[Symbol.dispose]()
  }

  toB() {
    return new B(this.inner.move())
  }

}

class B<T extends Disposable> {

  constructor(
    readonly inner: Box<T>
  ) { }

  [Symbol.dispose]() {
    this.inner[Symbol.dispose]()
  }

  toA() {
    return new A(this.inner.move())
  }

}

class Resource implements Disposable {

  disposed = false;

  [Symbol.dispose]() {
    console.log("disposed lol")
    this.disposed = true
  }

}

class Slice implements Disposable {

  disposed = false;

  [Symbol.dispose]() {
    console.log("disposed lol")
    this.disposed = true
  }

  copyAndDispose() {
    this[Symbol.dispose]()
    return "hello"
  }

}

await test("holder", async ({ test, message }) => {
  console.log(message)
  const resource = new Resource()
  const box = new Box(resource)

  {
    using a = new A(box)
    using b = a.toB()
  }

  assert(resource.disposed)
})

await test("greed", async ({ test, message }) => {
  console.log(message)

  const resource = new Resource()

  function take(box: Box<Resource>) {
    using box2 = box.moveIfNotMoved()
    assert(!box2.inner.disposed)
  }

  /**
   * This block will keep ownership of the box
   */
  {
    using box = new Box(resource)

    take(box.greed())
    take(box.greed())

    assert(!resource.disposed)
  }

  assert(resource.disposed)
})

await test("copyAndDispose", async ({ test, message }) => {
  console.log(message)

  const slice = new Slice()
  const box = new Box(slice)

  const copied = box.copyAndDispose()

  assert(copied === "hello")
  assert(slice.disposed)
})

