import { expect } from 'chai';
import { tryLatin, tryWriteLatin } from '../../../src/utils/latin';
import * as sinon from 'sinon';

describe('tryLatin()', () => {
  context('when given a buffer of length 0', () => {
    it('returns an empty string', () => {
      expect(tryLatin(new Uint8Array(), 0, 10)).to.equal('');
    });
  });

  context('when the distance between end and start is 0', () => {
    it('returns an empty string', () => {
      expect(tryLatin(new Uint8Array([1, 2, 3]), 0, 0)).to.equal('');
    });
  });

  let pushSpy;
  let fromCharCodeSpy;

  beforeEach(() => {
    pushSpy = sinon.spy(Array.prototype, 'push');
    fromCharCodeSpy = sinon.spy(String, 'fromCharCode');
  });

  afterEach(() => {
    sinon.restore();
  });

  context('when there is 1 byte', () => {
    context('that exceed 127', () => {
      it('returns null', () => {
        expect(tryLatin(new Uint8Array([128]), 0, 1)).be.null;
      });
    });

    it('calls fromCharCode once', () => {
      tryLatin(new Uint8Array([95]), 0, 1);
      expect(fromCharCodeSpy).to.have.been.calledOnce;
    });

    it('never calls array.push', () => {
      tryLatin(new Uint8Array([95]), 0, 1);
      expect(pushSpy).to.have.not.been.called;
    });
  });

  context('when there is 2 bytes', () => {
    context('that exceed 127', () => {
      it('returns null', () => {
        expect(tryLatin(new Uint8Array([0, 128]), 0, 2)).be.null;
        expect(tryLatin(new Uint8Array([128, 0]), 0, 2)).be.null;
        expect(tryLatin(new Uint8Array([128, 128]), 0, 2)).be.null;
      });
    });

    it('calls fromCharCode twice', () => {
      tryLatin(new Uint8Array([95, 105]), 0, 2);
      expect(fromCharCodeSpy).to.have.been.calledTwice;
    });

    it('never calls array.push', () => {
      tryLatin(new Uint8Array([95, 105]), 0, 2);
      expect(pushSpy).to.have.not.been.called;
    });
  });

  context('when there is 3 bytes', () => {
    context('that exceed 127', () => {
      it('returns null', () => {
        expect(tryLatin(new Uint8Array([0, 0, 128]), 0, 3)).be.null;
        expect(tryLatin(new Uint8Array([0, 128, 0]), 0, 3)).be.null;
        expect(tryLatin(new Uint8Array([128, 0, 0]), 0, 3)).be.null;
        expect(tryLatin(new Uint8Array([128, 128, 128]), 0, 3)).be.null;
        expect(tryLatin(new Uint8Array([128, 128, 0]), 0, 3)).be.null;
        expect(tryLatin(new Uint8Array([128, 0, 128]), 0, 3)).be.null;
        expect(tryLatin(new Uint8Array([0, 128, 128]), 0, 3)).be.null;
      });
    });

    it('calls fromCharCode thrice', () => {
      tryLatin(new Uint8Array([95, 105, 100]), 0, 3);
      expect(fromCharCodeSpy).to.have.been.calledThrice;
    });

    it('never calls array.push', () => {
      tryLatin(new Uint8Array([95, 105, 100]), 0, 3);
      expect(pushSpy).to.have.not.been.called;
    });
  });

  for (let stringLength = 4; stringLength <= 20; stringLength++) {
    context(`when there is ${stringLength} bytes`, () => {
      context('that exceed 127', () => {
        it('returns null', () => {
          expect(tryLatin(new Uint8Array(stringLength).fill(128), 0, stringLength)).be.null;
        });
      });

      it('calls fromCharCode once', () => {
        tryLatin(new Uint8Array(stringLength).fill(95), 0, stringLength);
        expect(fromCharCodeSpy).to.have.been.calledOnce;
      });

      it(`calls array.push ${stringLength}`, () => {
        tryLatin(new Uint8Array(stringLength).fill(95), 0, stringLength);
        expect(pushSpy).to.have.callCount(stringLength);
      });
    });
  }

  context('when there is >21 bytes', () => {
    it('returns null', () => {
      expect(tryLatin(new Uint8Array(21).fill(95), 0, 21)).be.null;
      expect(tryLatin(new Uint8Array(201).fill(95), 0, 201)).be.null;
    });
  });
});

describe('tryWriteLatin()', () => {
  context('when given a string of length 0', () => {
    it('returns 0 and does not modify the destination', () => {
      const input = Uint8Array.from({ length: 10 }, () => 1);
      expect(tryWriteLatin(input, '', 2)).to.equal(0);
      expect(input).to.deep.equal(Uint8Array.from({ length: 10 }, () => 1));
    });
  });

  context('when given a string with a length larger than the buffer', () => {
    it('returns null', () => {
      const input = Uint8Array.from({ length: 10 }, () => 1);
      expect(tryWriteLatin(input, 'a'.repeat(11), 0)).to.be.null;
      expect(tryWriteLatin(input, 'a'.repeat(13), 2)).to.be.null;
    });
  });

  let charCodeAtSpy;

  beforeEach(() => {
    charCodeAtSpy = sinon.spy(String.prototype, 'charCodeAt');
  });

  afterEach(() => {
    sinon.restore();
  });

  for (let stringLength = 1; stringLength <= 25; stringLength++) {
    context(`when there is ${stringLength} bytes`, () => {
      context('that exceed 127', () => {
        it('returns null', () => {
          expect(
            tryWriteLatin(
              new Uint8Array(stringLength * 3),
              'a'.repeat(stringLength - 1) + '\x80',
              0
            )
          ).be.null;
        });
      });

      it(`calls charCodeAt ${stringLength}`, () => {
        tryWriteLatin(
          new Uint8Array(stringLength * 3),
          String.fromCharCode(127).repeat(stringLength),
          stringLength
        );
        expect(charCodeAtSpy).to.have.callCount(stringLength);
      });
    });
  }

  context('when there is >25 characters', () => {
    it('returns null', () => {
      expect(tryWriteLatin(new Uint8Array(75), 'a'.repeat(26), 0)).be.null;
    });
  });
});
